package org.sorcerers.utils.jpadocs;

public class RelationInfo {
	
	private String name;
	private String destinationType;
	private String type;
	private boolean multiple = false;
	private boolean cascade = false;
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getDestinationType() {
		return destinationType;
	}
	public void setDestinationType(String destinationType) {
		this.destinationType = destinationType;
	}
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
	public boolean isMultiple() {
		return multiple;
	}
	public void setMultiple(boolean multiple) {
		this.multiple = multiple;
	}
	public boolean isCascade() {
		return cascade;
	}
	public void setCascade(boolean cascade) {
		this.cascade = cascade;
	}
	
}
