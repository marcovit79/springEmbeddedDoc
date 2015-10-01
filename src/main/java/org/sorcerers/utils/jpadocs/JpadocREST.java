package org.sorcerers.utils.jpadocs;

import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.lang.reflect.Member;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.persistence.EntityManagerFactory;
import javax.persistence.OneToMany;
import javax.persistence.metamodel.Attribute;
import javax.persistence.metamodel.Attribute.PersistentAttributeType;
import javax.persistence.metamodel.IdentifiableType;
import javax.persistence.metamodel.ManagedType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class JpadocREST {

	@Autowired
	private List<EntityManagerFactory> emfs;
	
	
	private Set<TypeInfo> infos;
	
	@PostConstruct
	private void readMetaModel() {
		infos = new HashSet<TypeInfo>();
		
		for(EntityManagerFactory emf: emfs) {
			Set<TypeInfo> info = emf.getMetamodel()
					.getManagedTypes()
					.stream()
					.map(this::fromType2Info)
					.collect(Collectors.toSet());
			infos.addAll(info);
		}
				
	}
	
	private TypeInfo fromType2Info(ManagedType<?> type) {
		TypeInfo result = new TypeInfo();
		result.setName(type.getJavaType().getSimpleName());
		result.setFqn(type.getJavaType().getName());
		
		type.getDeclaredAttributes().forEach( (Attribute<?,?> attr) -> {
			
			if(
					PersistentAttributeType.BASIC.equals(attr.getPersistentAttributeType())
					||
					PersistentAttributeType.ELEMENT_COLLECTION.equals(attr.getPersistentAttributeType())
				) {
				result.getAttributes().put(attr.getName(), attr.getJavaType().getSimpleName());
			}
			else {
				RelationInfo relInfo = this.extractRelation(attr);
				if(relInfo != null) {
					result.addRelation(relInfo);
				}
			}
			
			
		});
		
		IdentifiableType<?> superType = null;
		if(type instanceof IdentifiableType) {
			superType = ((IdentifiableType<?>)type).getSupertype();
		}
		
		
		if(superType != null) {
			result.setSuperType(superType.getJavaType().getSimpleName());
		}
		
		
		return result;
	}
	
	
	private RelationInfo extractRelation(Attribute<?, ?> attr) {
		Member member = attr.getJavaMember();
		Type typeDefinition = getGenericTypeFromMember(member);
		
		RelationInfo relInfo = new RelationInfo();
		relInfo.setName(attr.getName());
		relInfo.setType(attr.getPersistentAttributeType().name());
		
		// - find destination type
		if(typeDefinition instanceof ParameterizedType) {
			Type[] typeParams = ((ParameterizedType)typeDefinition).getActualTypeArguments();
			relInfo.setMultiple(true);
			Type valueType = typeParams[typeParams.length - 1];
			String valueTypeName = ((Class<?>)valueType).getSimpleName();
			relInfo.setDestinationType( valueTypeName );
		}
		else {
			relInfo.setDestinationType(attr.getJavaType().getSimpleName());
		}
		
		// - find cascade
		OneToMany oneToMany = getAnnotation(member, OneToMany.class);
		if(oneToMany != null && oneToMany.cascade().length > 0) {
			relInfo.setCascade(true);
		}
		
		return relInfo;
	}

	private Type getGenericTypeFromMember(Member member) {
		Type genericType;
		if(member instanceof Field) {
			Field field = (Field) member;
			genericType = field.getGenericType();
		}
		else if(member instanceof Method) {
			Method method = (Method) member;
			genericType = method.getGenericReturnType();
		}
		else {
			throw new UnsupportedOperationException("Unsupported member type " + member.getClass() + " for " + member);
		}
		return genericType;
	}
	
	private <T extends Annotation> T getAnnotation(Member member, Class<T> annotationClass) {
		T result;
		if(member instanceof Field) {
			Field field = (Field) member;
			result = field.getAnnotation(annotationClass);
		}
		else if(member instanceof Method) {
			Method method = (Method) member;
			result = method.getAnnotation(annotationClass);
		}
		else {
			throw new UnsupportedOperationException("Unsupported member type " + member.getClass() + " for " + member);
		}
		return result;
	}
	
	
	@RequestMapping("/rest/modelinfo")
	public Set<TypeInfo> getInfos() {
		return infos;
	}
	
	
}
