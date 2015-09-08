

/*************************************************************************************************/
/***                            JOINT-JS CLASS DIAGRAM HANDING CODE                            ***/
/*************************************************************************************************/

/**
 * Initialize an empty graph
 * 
 * diagramName: the name of the diagram
 * paperElementOrSelector: parameter for a jQuery(paperElementOrSelector) call
 * colorMap: object with color configuration
 * width: in pixel
 * height: in pixel
 */
function ClassDiagram(diagramName, paperElementOrSelector, colorMap, filtersMap, dbClick, width, height) {
	this._name = diagramName; // not very useful
	this._colors = colorMap;
	this._filter = (filtersMap && filtersMap[this._name]);
	this._dbClickCallback = dbClick;
	
	
	this._graph = new joint.dia.Graph();
	this._paper = new joint.dia.Paper({
	    el: jQuery(paperElementOrSelector),
	    width: width,
	    height: height,
	    gridSize: 1,
	    model: this._graph
	});
}

/**
 * Scale the entire diagram
 */
ClassDiagram.prototype.setScale = function ClassDiagram__setScale(scale) {
	this._paper.scale(scale);
}

/**
 * Decide if exclude a JPA type in the diagram
 * @param type the JPA managed type
 */
ClassDiagram.prototype.isFilteredOut = function ClassDiagram__isFilteredOut(type) {
	var filteredOut = false;
	
	var activeFilter = this._filter;
	if(activeFilter) {
		var moduleName = this.getModuleName(type);
		filteredOut =  ( activeFilter.indexOf(moduleName) < 0 );
	}
	
	return filteredOut;
}

/**
 * Draw the class diagram of the given model with the given layout
 * modelData: a map of JPA managed type structure 
 * layoutData: layout information about whole diagram 
 */
ClassDiagram.prototype.drawGraph = function ClassDiagram__computeGraph(modelData, layoutData) {
	var self = this;
	
	// - List of classes inserted in the diagram
	var classesJointJsModelsMap = {};
	
	// - List of all the relations in the diagram
	var relationList = [];
	
	modelData.forEach( function(type) {
		
		// - Handle module filter 
		if( ! self.isFilteredOut(type)) {
			
			// - create the widgets for the classes
			var classJointJsModel = self.drawOneClass(type, layoutData);
			classesJointJsModelsMap[type.name] = classJointJsModel;
			
			
			// - fields relations
			for(var relationName in type.relations) {
				var relation = type.relations[relationName];
				
				relationList.push({ 
					from: type.name, 
					to: relation.destinationType, 
					label: relation.name,
					type: self.chooseRelationType( relation )
				});
			}
			
			// - class hierarchy relations
			if(type.superType) {
				relationList.push({ from: type.name, to: type.superType, type: 'Generalization'})
			}
		}
	});
	
	
	// - add all the relations to the diagram
	relationList.forEach( function(rel) {
		
		rel.fromId = classesJointJsModelsMap[rel.from].id;
		rel.toId = classesJointJsModelsMap[rel.to].id;
		
		self.drawOneRelation(rel, layoutData);
	})	
}

/**
 * draw a relation with some visual trick for the arrow of the associations
 * relationData: the information about the JPA annotated relation
 * layoutData: layout information about whole diagram 
 */
ClassDiagram.prototype.drawOneRelation = function ClassDiagram__drawOneRelation(relationData, layoutData) {
	
	// - define JointJS link label
	var labels = [];
	if(relationData.label) {
		labels.push({ position: .5, attrs: { text: { text: relationData.label } } });
	}
	
	// - add the link (aka relation) to the diagram 
	var jointJsModel = new joint.shapes.uml[relationData.type]({
		source : { id: relationData.fromId, name: relationData.from},
		target : { id: relationData.toId},
		labels: labels,
		vertices: this.getStoredVerticles(layoutData, relationData.from, relationData.label) || []
	});
	
	// - if I put an arrow here JointJS draw a shorter line. So ...
	if(relationData.type == 'Association') {
		// ... I give him an empty marker ...
		jointJsModel.attr({
			'.marker-target': { fill: 'none', d: '' }
		})
	}
	this._graph.addCell(jointJsModel);
	
	// ... and I draw the arrow by myself. FIXME: this make the arrow disappear on each redraw
	if(relationData.type == 'Association') {
		var linkView = this._paper.findViewByModel(jointJsModel);
		jQuery(linkView.el).find("path.marker-target").attr("d", "M 20 -10 L 0 0 L 20 10");
	}
}

/**
 * Draw one class adding some visual trick like color and javadoc tooltip
 * classData: the information about JPA managed type
 * layoutData: layout information about whole diagram 
 */
ClassDiagram.prototype.drawOneClass = function ClassDiagram__drawOneClass(classData, layoutData) {
	var self = this;
	
	// - Compute attribute list
	var attributes = _.chain(classData.attributes).pairs().collect(function (pair) {
		return pair[0] + ": " + pair[1];
	}).value();
	
	// - Add class widget into diagram
	var jointJsModel = new joint.shapes.uml.Class({
		position: this.getStoredPosition(layoutData, classData.name) || { x:10  , y: 10 },
		size: { 
			width: 240, 
			height: 50 + attributes.length * 20
		},
		
		name: classData.name,
		attributes: attributes
	})
	this._graph.addCell(jointJsModel);

	// - prepare for view tricks
	var classView = this._paper.findViewByModel(jointJsModel);
	
	// - color based on module
	var color = this.chooseClassColor(classData) || "#FFFFFF";
	jQuery(classView.el).find("rect[fill]").attr("fill", color);
	
	// - make something (usually show javadoc) on dblclick
	jQuery(classView.el).on("dblclick", function() {
		self._dbClickCallback(classData);
	});	
	return jointJsModel;
}

/**
 * choose id a JPA relation is an UML Composition, Aggregation or Association
 * @param relation
 * @returns
 */
ClassDiagram.prototype.chooseRelationType = function ClassDiagram__chooseRelationType(relation) {
	var relType;
	if(relation.multiple && relation.cascade) {
		relType = 'Composition';
	}
	else if (relation.multiple) {
		relType = 'Aggregation';
	}
	else {
		relType = 'Association';
	}
	return relType;
}

/**
 * Get the module name of the class
 * @param type the JPA managed type
 * @returns a string
 */
ClassDiagram.prototype.getModuleName = function ClassDiagram__getModuleName(type) {
	var packagePath = type.fqn.split("\.");
	var moduleName = packagePath[packagePath.length - 3];
	return moduleName;
}

/**
 * Choose the color of a JPA managed type
 * @param type the JPA managed type
 * @returns an HTML color string
 */
ClassDiagram.prototype.chooseClassColor = function ClassDiagram__chooseClassColor(type) {
	var moduleName = this.getModuleName(type);
	
	var color = this._colors[moduleName];
	return color;
}

/**
 * Given a whole graph layout data. 
 * Extract layout information relative to an entity <code>type</code>
 */
ClassDiagram.prototype.getStoredPosition = function ClassDiagram__getStoredPosition(layoutData, name) {
	var result = null;
	if(layoutData) {
		var cellData = layoutData[name];
		if(cellData) {
			result = cellData.position;
		}
	}
	return result;
}

/**
 * Given a whole graph layout data. 
 * Extract layout information relative to relation <code>relName</code> that start from entity
 * <code>type</code>
 */
ClassDiagram.prototype.getStoredVerticles = function ClassDiagram__getStoredVerticles(layoutData, type, relName) {
	var result = null;
	if(layoutData) {
		var cellData = layoutData[type];
		if(cellData && cellData.relations) {
			result = cellData.relations[relName || "isA"];
		}
	}
	return result;
}

/**
 * Extract the layout informations from the internal JointJs graph and return them as a 
 * javascript object
 */
ClassDiagram.prototype.extractLayoutData = function ClassDiagram__extractLayoutData() {
	var allGraphData = this._graph.toJSON();
	var toSave = {};
	
	// - extract position of classes
	allGraphData.cells.forEach(function(cell) {
		var name = cell.name;
		if(name) {
			toSave[name] = toSave[name] || {}
			toSave[name].position = cell.position;
		}
	});
	
	// - extract intermediate points of relations
	allGraphData.cells.forEach(function(cell) {
		var vertices = cell.vertices;
		if(vertices && vertices.length) {
			var entityTypeName = cell.source.name;
			
			var relationName;
			if(cell.labels && cell.labels.length) {
				relationName = cell.labels[0].attrs.text.text;
			}
			else {
				relationName = "isA";
			}
			
			var entityTypeData = toSave[entityTypeName];
			entityTypeData.relations = entityTypeData.relations || {};
			entityTypeData.relations[relationName] = vertices;
		}
	});

	return toSave;
}


/*************************************************************************************************/
/***                                  CLASS DIAGRAM DIRECTIVE                                  ***/
/*************************************************************************************************/
var isBasePresent;
try { 
	var m = angular.module("base");
	isBasePresent = !!m;
} 
catch(err) {isBasePresent = false}
var dependenciesList = isBasePresent ? ["base"] : ["ngResource", "ui.bootstrap", "ui.bootstrap.modal"];


var module = angular.module("ModelDoc", dependenciesList);


module.directive("classDiagram", function() {
	
	var colorMap = {
		product: "#AAAAAA",
		sourcecode: "#FFFF66",
		review: "#FFCCCC",
		extsys: "#996633",
		issuetracking: "#FF6666",
		organization: "#33CCFF",
		classifications: "#666699",
		utils: "#FFFFFF"
	}
	
	var filterMap = {
		all: null,
		onlyCore: ['extsys', 'product', 'utils']	
	}
	
	return {
 		restrict : 'A',
 		scope : {
 			layoutData : "=layoutData",
 			modelData: "=modelData",
 			dblclick: "&dblclick",
 			name: "=name"
 		},
 		link : function(scope, element, attr) {
 			element.empty();
 			
 			var diagram;
 			
 			// - Redraw the diagram at every data modification
 			function registerDataWatch() {
 				return scope.$watchGroup(['layoutData.data', 'modelData'], function(newValues, oldValues, scope) {
 	 				
 					var layoutData = newValues[0] || {};
 					var modelData = newValues[1] || [];
 					
 	 				// - FIXME: now regenerate all every time
 	 	 			element.empty();
 	 				
 	 				diagram = new ClassDiagram(
 	 	 					scope.name, 
 	 	 					element, 
 	 	 					colorMap,
 	 	 					filterMap,
 	 	 					function(classData) {
 	 	 						scope.dblclick({ type: classData});
 	 	 					},
 	 	 					10 * jQuery(document).innerWidth(), 
 	 	 					5 * jQuery(document).innerHeight()
 	 	 				);
 	 	 			diagram.drawGraph( modelData, layoutData);
 	 			});
 			}
 			var deregisterDataWatch = registerDataWatch();
 			
 			// - Update the layout data disabling the repaint because this modification 
 			//   came from a visual modification of the diagram.
 			element.on("mouseup", function() {
 				
 				if(diagram) {
 					var layoutData = diagram.extractLayoutData();
 					deregisterDataWatch();
 					scope.$apply(function() {
 						scope.layoutData.data = layoutData;
 					});
 					deregisterDataWatch = registerDataWatch();
 				}
 			});
 			
 			// - handle rescaling of the diagram
 			scope.$watch("layoutData.scale", function(newValue, oldValue) {
 				console.log("directive scale");
 				if(diagram && newValue) {
 					
 					var newScale = Math.max(0.1, newValue/100);
 	 				newScale = Math.min(1, newScale);
 					diagram.setScale(newScale);
 				}
 			});
 		}
 	}
});

/*************************************************************************************************/
/***                    PAGE WITH ONE CLASS DIAGRAM WITH ALL THE MODEL CLASS                   ***/
/*************************************************************************************************/
function getMeta(name) {
	var foundedMetas = jQuery(document).find("head meta[name='" + name + "']");
	var result = null;
	if(foundedMetas.length > 0) {
		result = foundedMetas.attr("content");
	}
	return result;	
}


module.controller("ClassDiagrams", [
   	"$scope", "$modal", "$resource",
	function($scope, $modal, $resource) {
   		$scope.self = $scope;
		
   		$scope.diagramsNames = ['all', 'onlyCore'];
   		$scope.selectedDiagramName = 'all';
   		
   		$scope.diagramControllers = {};
   		
		var serverApi = getMeta("serverApi");
		$resource(serverApi).query(function(data) {
			$scope.modelData = data;
		});
		
		function chooseChild() {
			var choosen = $scope.diagramControllers[$scope.selectedDiagramName];
			return choosen;
		}
		
		$scope.showLayoutData = function() {
			var layoutData = chooseChild().getLayoutData();
			$scope.openJsonModal(layoutData);
		}
		
		$scope.loadLayoutFromLocalStorage = function() {
			chooseChild().loadLayoutFromLocalStorage();
		}
		
		$scope.saveLayoutToLocalStorage = function() {
			chooseChild().saveLayoutToLocalStorage();
		}
		
		$scope.openJsonModal = function(jsObj) {
			var modalInstance = $modal.open({
				template: '<pre>{{json}}</pre>',
				controller: [ "$scope", function($scope) {
					$scope.json = angular.toJson(jsObj, true);
				}],
				size: 'lg',
				resolve: { }
			});
		}
		
		$scope.showJavadoc = function(classData) {
			var modalInstance = $modal.open({
				template: '<iframe src="{{url}}" style=" width:100%; height:90vh;" ></iframe>',
				controller: [ "$scope", function($scope) {
					
					var javadocPath = getMeta("javadocBaseUrl") 
					                + "/" 
					                + classData.fqn.replace(/\./g, "/")
					                + ".html";
					$scope.url = javadocPath;
				
				}],
				size: 'lg',
				resolve: { }
			});
		}
	}
]);


module.controller("ClassDiagram", [
	"$scope", "$resource", "$attrs", 
	function($scope, $resource, $attrs) {
		$scope.self = $scope;
		
		$scope.layout = { 
			data: {},
			scale: 100
		}
		
		$scope.name = $scope.$eval($attrs.name);
		$scope.diagramControllers[$scope.name] = $scope;
		
		$scope.loadLayoutFromLocalStorage = function() {
			var layoutDataString = localStorage["model_diagram_"+$scope.name];
			$scope.layout.data = angular.fromJson(layoutDataString);
		}
		
		$scope.saveLayoutToLocalStorage = function() {
			var layoutDataString = angular.toJson($scope.layout.data);
			localStorage["model_diagram_"+$scope.name] = layoutDataString; 
		}
		
		$scope.getLayoutData = function() {
			var layoutData = $scope.layout.data;
			return layoutData;
		}
		
		$scope.$on("$destroy", function () {
			delete $scope.diagramControllers[$scope.name]
		});
		
		// - load layout data
		$resource(getMeta("layoutsUrl") + '/classes/' + $scope.name + ".json").get(function(laoutData) {
			$scope.layout.data = laoutData;
		});
	}
]);


