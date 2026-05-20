sap.ui.define([
		"sap/m/MultiComboBox",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator"
	],
	function (oMultiComboBox, Filter, FilterOperator) {
		"use strict";
		
		/**
		 * Este componente se ha creado extendiento el MultiComboBox para poder realizar la 
		 * llamada para el listado de elemento de este a partir de un numero de caracteres utilizando
		 * lo escrito en el componente para filtrar a nivel del oData
		 * 
		 * @namespace CustomMultiComboBox
		 */
	 
		var MultiComboBox = oMultiComboBox.extend("gpro.gpro.utils.CustomMultiComboBox", {
			metadata: {
	            library: "sap.m",
	            abstract: true,
	            defaultAggregation: "items",
	            properties: {
	            	
	                /**
					 * Keys of the selected items. If the key has no corresponding item, no changes will apply. 
					 * If duplicate keys exists the first item matching the key is used.
					 * 
					 * @memberof CustomMultiComboBox
					 * @property selectedKeys
					 */
					selectedKeys: { type: "string[]", group: "Data", defaultValue: [] },
	
					/**
					 * Defines if there are selected items or not.
					 * 
					 * @memberof CustomMultiComboBox
					 * @property hasSelection
					 */
					hasSelection: { type: "boolean", visibility: "hidden", defaultValue: false },
	
					/**
					 * Determines if the select all checkbox is visible on top of suggestions.
					 * 
					 * @memberof CustomMultiComboBox
					 * @property showSelectAll
					 */
					showSelectAll: { type: "boolean", defaultValue: false },
				
					/**
					 * El minimo de caracteres para buscar el listado de elementos 
					 * haciando llamada al oData bindeado utilizando estos caracteres como filtro
					 * 
					 * @memberof CustomMultiComboBox
					 * @property startSearch
					 */
	                startSearch: {
	                	type: "int",
	                    defaultValue: 1
	                },
	                
	                /**
					 * Esta propiedad indica si se debe hacer una llamada al oData cuando se
					 * han escrito el numero necesario de caracteres
					 * 
					 * @memberof CustomMultiComboBox
					 * @property liveUpdate
					 */
	                liveUpdate: { type: "boolean", defaultValue: true },

					/**
					 * Esta propiedad indica el tipo del valor introducido
					 * 
					 * @memberof CustomMultiComboBox
					 * @property valueType
					 */
					valueType: { type: "String", defaultValue: "String"},

					/**
					 * Esta propiedad indica el tipo del valor introducido
					 * 
					 * @memberof CustomMultiComboBox
					 * @property valueType
					 */
					filterBy: { type: "String[]", group: "Data", defaultValue: [] },
	            },
	            associations: {

					/**
					 * Provides getter and setter for the selected items from
					 * the aggregation named items.
					 * 
					 * @memberof CustomMultiComboBox
					 * @association selectedItems
					 */
					selectedItems: { type: "sap.ui.core.Item", multiple: true, singularName: "selectedItem" }
				},
				aggregations: {
					
					/**
					 * The tokenizer which displays the tokens
					 * 
					 * @memberof CustomMultiComboBox
					 * @aggregation tokenizer
					 */
					tokenizer: {type: "sap.m.Tokenizer", multiple: false, visibility: "hidden"}
				},
				events: {
	
					/**
					 * Event is fired when selection of an item is changed.
					 * Note: please do not use the "change" event inherited from sap.m.InputBase
					 */
					selectionChange: {
						parameters: {
	
							/**
							 * Item which selection is changed
							 */
							changedItem: { type: "sap.ui.core.Item" },
	
							/**
							 * Array of items whose selection has changed.
							 */
							changedItems : {type : "sap.ui.core.Item[]"},
	
							/**
							 * Selection state: true if item is selected, false if
							 * item is not selected
							 */
							selected: { type: "boolean" },
	
							/**
							 * Indicates whether the select all action is triggered or not.
							 */
							selectAll : {type : "boolean"}
						}
					},
	
					/**
					 * Event is fired when user has finished a selection of items in a list box and list box has been closed.
					 */
					selectionFinish: {
						parameters: {
	
							/**
							 * The selected items which are selected after list box has been closed.
							 */
							selectedItems: { type: "sap.ui.core.Item[]" }
						}
					}
				},
				dnd: { draggable: false, droppable: true }
			},
	        renderer: {
	        	
	        }
		});
		
		MultiComboBox.prototype.addStyleClass("customMultiComboBoxStyle");
		
		function fnSelectTextIfFocused(iStart, iEnd) {
			if (document.activeElement === this.getFocusDomRef()) {
				this.selectText(iStart, iEnd);
			}
		}
		
		/**
		 * Se sobreescribe la funcion oninput para poder hacer una llamada al oData bindeado si el numero de 
		 * caracteres escritos es justo igual al valor de la propiedad startSearch. Si es menor no se aplica ninguna accion
		 * y si es mayor se utiliza el listado existente para filtrar
		 * 
		 * @memberof CustomMultiComboBox
		 * @method oninput
		 */
		MultiComboBox.prototype.oninput = function(oEvent) {
			
			const that = this;
			const startSearch = that.getProperty("startSearch");
			const liveUpdate = that.getProperty("liveUpdate");
			const valueType = that.getProperty("valueType");
			const filterBy = that.getProperty("filterBy");
			const sValue = oEvent.target.value;
			const argumentsEvent = arguments;
			
			if(liveUpdate && sValue !== undefined && (
				sValue.length === startSearch || 
				(sValue.length > startSearch && !that._sOldValue)
			)) {
				console.log("A")
				that.setBusy(true);

				var oContextItems = that.getBindingInfo("items");
				const selectedItems = that.getSelectedItems();
				var selectedKeys = [];
				var filters = [];

				switch(valueType){
					case "String":
						for(let idField of filterBy){
							for(let element of selectedItems){	
								selectedKeys.push(element.getKey());
								filters.push(
									new Filter(
										idField, 
										FilterOperator.EQ,
										element.getKey()
									)
								);
							}
							
							filters.push(
								new Filter(
									"tolower(" + idField + ")", 
									FilterOperator.Contains,
									"tolower('" + sValue + "')"
								)
							);
						}
					break;
					case "GUID":
						for(let idField of filterBy){
							for(let element of selectedItems){		
								selectedKeys.push(element.getKey());
								filters.push(
									new Filter(
										idField, 
										FilterOperator.EQ,
										element.getKey()
									)
								);
							}
						}
					break;
				}
				
				if(filters.length > 1) {
					filters = new Filter({
						filters: filters,
						and: false
					});
					
				}

				oContextItems.filters = filters;
				oContextItems.events = {
					
					dataRequested: function() {
						that.setBusy(true);
					},
					
					dataReceived: function(oEventDataReceived) {
						that.setBusy(true);
						oMultiComboBox.prototype.oninput.apply(that, argumentsEvent);
						that.setSelectedKeys(selectedKeys);
						
						if(that.getItems().length === selectedKeys.length) {
							that.close();
							
							that._sDomValue = sValue;
							that.setValue("");
						
						} else {
							that._sDomValue = "";
							that.setValue(sValue);
						}

						that.setBusy(false);
					}
				};
				
				that.setBusy(true);
				that.bindItems(oContextItems);
				
			} else if(that.isBusy()){
				that.setValue(sValue ? sValue.substring(0, startSearch) : "");
			} else if(!liveUpdate && sValue !== undefined && sValue.length === startSearch) {
				oMultiComboBox.prototype.oninput.apply(that, argumentsEvent);
			} else if(sValue && sValue.length > startSearch) {
				oMultiComboBox.prototype.oninput.apply(that, argumentsEvent);
			} else {
				that.close();
			}
		};

		//MultiComboBox.prototype.remo

		return MultiComboBox;
	});