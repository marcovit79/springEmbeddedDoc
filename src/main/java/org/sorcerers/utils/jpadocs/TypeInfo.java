package org.sorcerers.utils.jpadocs;

import java.util.HashMap;
import java.util.Map;


public class TypeInfo {

	private String name;

	private String fqn;
	
	private String superType = null;
	
	private Map<String, String> attributes = new HashMap<>();
	
	private Map<String, RelationInfo> relations = new HashMap<>();
	
	public void addRelation(RelationInfo relInfo) {
		relations.put(relInfo.getName(), relInfo);
	}
	
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}

	public String getFqn() {
		return fqn;
	}
	public void setFqn(String fqn) {
		this.fqn = fqn;
	}
	public String getSuperType() {
		return superType;
	}
	public void setSuperType(String superType) {
		this.superType = superType;
	}
	public Map<String, String> getAttributes() {
		return attributes;
	}
	public Map<String, RelationInfo> getRelations() {
		return relations;
	}
	
	
}
