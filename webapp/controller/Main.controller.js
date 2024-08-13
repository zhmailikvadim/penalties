sap.ui.define([
    "./BaseController",
	".././models/models",
	".././models/formatter",
	".././modules/ApiModule",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/core/ValueState",
	"sap/base/strings/formatMessage",
	"sap/base/util/deepExtend",
	"sap/ui/model/FilterOperator"
], function (BaseController, models, Formatter, ApiModule, MessageToast, Fragment, JSONModel, MessageBox, ValueState, FormatMessage, DeepExtend, FilterOperator) {
	"use strict";

	return BaseController.extend("by.mda.bn.penalties.controller.App", {
			
		formatter: Formatter,
		
		onInit : function () {
			this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
       		this.oRouter = this.getRouter();
			this.oApiModule = new ApiModule(this, this.oBundle);
			this.setModel(new JSONModel({
				"tableData": []
			}), "appData");
			this.setModel(new JSONModel({}), "filterModel");
			this.setModel(new JSONModel({}), "filterListModel");
			this.setModel(models.createConfigModel(), "config");
			this.oRouter.getRoute("Default").attachMatched(this._onDefaultRouteMatched, this);
		},	

		onAfterRendering: function(oEvent) {
			this.setModel(new JSONModel({
				items: [],
				columns: this.byId("mainTable").getColumns().map(oColumn => {
					const sI18nPath = oColumn.getLabel().getBindingInfo("text").parts[0].path
					return {
						columnKey: oColumn.data("prop"),
						text: this.oBundle.getText(sI18nPath)
					};
				})
			}), "sortModel");
		},

		onContext: function(oEvent) {
			this.oCol = oEvent.getParameter("column");
			if (!this._oMenuFragment) {
				this._oMenuFragment = Fragment.load({
					name: "by.mda.bn.penalties.fragment.tableMenu",
					controller: this
				}).then(function(oMenu) {
					this.getView().addDependent(oMenu);
					oMenu.openBy(this.oCol);
					this._oMenuFragment = oMenu;
					return this._oMenuFragment;
				}.bind(this));
			} else {
				this._oMenuFragment.openBy(this.oCol);
			}
			oEvent.preventDefault();
		},

		onSortAction: function(oEvent) {
			const sAction = oEvent.getParameter("item").getProperty("key");
			const oTable = this.byId("mainTable");
			switch (sAction) {
				case "Descending":
				case "Ascending":
					oTable.sort(this.oCol, sAction, true);
					break;
				case "Custom":
					this._openSortDialog();
					break;
				default:		
			}
		},

		onClearSorter: function() {
			const oTable = this.byId("mainTable");
			const aColumns = oTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				aColumns[i].setSorted(false);
			}
			oTable.getBinding("rows").sort(null);
			this._clearTableSorters(oTable);
		},

		_openSortDialog: function() {
			const oDialog = this.byId("idSortColumns").getDependents()[0];
			oDialog.setShowResetEnabled(true);
			const oSortPanel = oDialog.getPanels()[0];
			const oTable = this.byId("mainTable");
			const aSortedColumns = oTable.getSortedColumns();
			const mCorrectColumns = new Map();
			aSortedColumns.forEach(oColumn => mCorrectColumns.set(oColumn.getId(), oColumn));
			oSortPanel.removeAllSortItems();
			mCorrectColumns.forEach(oColumn => {
				oSortPanel.addSortItem(new sap.m.P13nSortItem({
					columnKey: oColumn.data("prop"),
					operation: oColumn.getSortOrder()
				}));
			});
			oDialog.open();
		},

		onOpenSortDialogPress: function(oEvent) {
			this._openSortDialog();
		},

		onSortDialogOkPress: function(oEvent) {
			const oDialog = oEvent.getSource();
			const aConditions = oDialog.getPanels()[0]._getConditions();
			if (aConditions.length === 0) {
				this.onClearSorter();
			} else {
				const oTable = this.byId("mainTable");
				const mSortColumns = {};
				oTable.getColumns().forEach(oColumn => mSortColumns[oColumn.data("prop")] = oColumn);
				this._clearTableSorters(oTable);
				aConditions.forEach(oCondition => {
					oTable.sort(mSortColumns[oCondition.keyField], oCondition.operation, true)
				});
			}

			oDialog.close();
		},

		onClearFilter: function () {
			this.setModel(new JSONModel({}), "filterModel");
		},

		onSortDialogAfterClose: function(oEvent) {
		},

		onSortDialogCancelPress: function(oEvent) {
			oEvent.getSource().close();
		},

		onSortDialogResetPress: function(oEvent) {
			const oDialog = oEvent.getSource();
			const oPanel = oDialog.getPanels()[0];
			oPanel.removeAllSortItems();
			this.onClearSorter();
			oDialog.close();
			oDialog.setShowResetEnabled(true);
		},

		_clearTableSorters: function(oTable) {
			oTable._aSortedColumns = [];
		},

		onSearch: async function() {
			this.getView().setBusy(true);
			const oFilters = this.getModel("filterModel").getData();
			const sFilterData = this._parseFilters(oFilters);
			const sFilter = sFilterData ? `?filter=${sFilterData}` : "";
			try {
				await this.oApiModule.readData(sFilter);
			} catch (oError) {
				this.showAndLogError("errorLoad", oError);
			}
			this.getView().setBusy(false);
		},

		onCancel: function() {
			this.getModel("filterModel").setData(this._oFilterData);
		},

		handelFilterDialogOpen: function() {
			this._oFilterData = DeepExtend({}, this.getModel("filterModel").getData());
		},

		_parseFilters: function(oFilters) {
			let aFilters = Object.keys(oFilters).map(sKey => oFilters[sKey]);
			aFilters = aFilters.filter(aRanges => aRanges.length !== 0);
			if (aFilters.length === 0) {
				return "";
			} else {
				const sFilter = aFilters.map((aRanges) => {
					return "(" + aRanges.map((oRange) => {
						if (oRange.keyField === "CR_DATE") {
							return this._getStringFilters(
								oRange.range.keyField, 
								oRange.range.operation, 
								sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyyMMdd" }).format(oRange.range.value1),
								sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyyMMdd" }).format(oRange.range.value2)
							);
						} else if (!!oRange.row) {
							return this._getStringFilters(oRange.keyField, FilterOperator.EQ, oRange.key);
						} else{
							return this._getStringFilters(oRange.range.keyField, oRange.range.operation, oRange.range.value1);
						}
					}).join(" OR ") + ")";
				}).join(" AND ");
				return aFilters.length === 1 ? sFilter : `(${sFilter})`;
			}
		},

		_formatCharCode: function (sValue) {
            return sValue.split("").map(sChar => `0x${sChar.charCodeAt(0)}`).join("");
        },

		_getStringFilters: function(sFieldName, sFilterOperator, sValue1, sValue2) {
			switch (sFilterOperator) {
				case FilterOperator.EQ:
				case FilterOperator.GE:
				case FilterOperator.GT:
				case FilterOperator.LE:
				case FilterOperator.LT:
				case FilterOperator.StartsWith:
				case FilterOperator.EndsWith:
				case FilterOperator.Contains:
				case FilterOperator.NotEndsWith:
				case FilterOperator.NotStartsWith:
				case FilterOperator.NotContains:
					return FormatMessage("{0} {2} ''{1}''", sFieldName, this._formatCharCode(sValue1), sFilterOperator);
				case FilterOperator.BT:
					return FormatMessage("{0} {3} ''{1}'' AND ''{2}''", sFieldName, sValue1, sValue2, sFilterOperator);
				default:
					throw new Error("Unsupported filter operator: " + sFilterOperator);
			}
		},

		onRowSelectionChange: function(oEvent) {
			let oTable = this.byId("mainTable");
			let aSelectedIndexes = oTable.getSelectedIndices();
			let oModel = this.getModel("config");
			let oModelData = oModel.getData();
			oModelData.mainTable.isOneSelectedItem = aSelectedIndexes.length == 1 ? true : false;
			oModelData.mainTable.isMultiSelectedItem = aSelectedIndexes.length > 0 ? true : false;
			oModel.refresh();
		},

		onCreate: function() {
			this.oRouter.navTo("Detail", {
				mode: "create"
			});		
		},

		onEdit: function() {
			let sId = this._selectTableRow();
			this.oRouter.navTo("Detail", {
				mode: "edit",
				id: sId
			});	
		},

		onViewDetails: function() {
			let sId = this._selectTableRow();
			this.oRouter.navTo("Detail", {
				mode: "view",
				id: sId
			});	
		},

		onDelete: function() {
			MessageBox.error(
				this.oBundle.getText("deleteConfirmMessage"),
				{
					title: this.oBundle.getText("deleteConfirmTitle"),
					actions: [this.oBundle.getText("deleteButton"), this.oBundle.getText("cancelButton")],
					styleClass: "sapUiSizeCompact",
					onClose: async (sAction) => {
						if (sAction == this.oBundle.getText("deleteButton")) {
							this.getView().setBusy(true);
							let oModel = this.getModel("appData");
							let oTable = this.byId("mainTable");
							let aSelectedIndexes = oTable.getSelectedIndices();
							let aRows = oTable.getRows();
							let aEntitiesToRemove = [];
							let aIds = aSelectedIndexes.map((iSelectedIndex)=> {
								let sPath = aRows[iSelectedIndex].getBindingContext("appData").getPath();
								let oEntity = oModel.getProperty(sPath);
								let sId = oEntity.ID;
								aEntitiesToRemove.push(oEntity);
								return sId;
							});
							if (await this.oApiModule.deleteEntites(aIds, aEntitiesToRemove)) {
								oTable.clearSelection();
								MessageToast.show(this.oBundle.getText("deleteComplete"));
								let oMainData = oModel.getProperty("/tableData");
								oModel.setProperty("/tableData", oMainData.filter((oItem) => {
									return !aIds.includes(oItem.ID);
								}));
							} else {
								MessageBox.error(
									this.oBundle.getText("deleteProblems"),
									{
										title: this.oBundle.getText("deleteConfirmTitle"),
										actions: [this.oBundle.getText("closeButton")],
										styleClass: "sapUiSizeCompact"
									}
								);
							}
							this.getView().setBusy(false);
						}
					}
				}
			);
		},

		_onDefaultRouteMatched: async function(oEvent) {
			this.getOwnerComponent().getService("ShellUIService").then((oShellService) => {
				oShellService.setBackNavigation(() => {
					let oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");  
					oCrossAppNavigator.toExternal({  
						target: { 
							semanticObject : "#"
						}  
					}); 
				});
			});
			this.getView().setBusy(true);
			await this.onSearch();
			let oModel = this.getModel("config");
			let oModelData = oModel.getData();
			oModelData.mainTable.isOneSelectedItem = false;
			oModelData.mainTable.isMultiSelectedItem = false;
			oModel.refresh();
			this.byId("mainTable").clearSelection();
			this.getView().setBusy(false);	
		},

		_selectTableRow: function() {
			let oTable = this.byId("mainTable");
			let iSelectedIndex = oTable.getSelectedIndices()[0];
			let sPath = oTable.getContextByIndex(iSelectedIndex).getPath();
			let oSelectedObject =this.getModel("appData").getProperty(sPath);
			return oSelectedObject.ID;
		},
		
		_setStateByID: function(sState, sId) {
			this.byId(sId).setValueState(sState);
		},

		_prepareSelectionModel: async function(oEvent) {
			const oFilters = this.getModel("filterModel").getData();
			const oValid = {};
			let oSource;
			if (oEvent) {
				oSource = oEvent.getSource();
				oSource.setBusy(true);
				const sKey = oSource.getProperty("descriptionKey");
				for (let key in oFilters) {
					if (key === sKey) continue;
					oValid[key] = oFilters[key];
				}			
			}
			const sFilterData = this._parseFilters(oValid);
			const sFilter = sFilterData ? `?filter=${sFilterData}` : "";
			
			this.getView().setBusy(true);
			try {
				const oResponse = await this.oApiModule.readFilterData(sFilter);
				let oFiltersList = {};
				let oSet = {};
				if (!!oResponse.length) {
					for (let key in oResponse[0]) {
						oSet[key] = new Set();
						oFiltersList[key] = [];
					}
					oResponse.forEach(oItem => {
						for (let key in oItem) {
							let sKey = typeof oItem[key] === "object" ? oItem[key].VALUE : oItem[key];
							if (!oSet[key].has(sKey)) {
								oSet[key].add(sKey)
								oFiltersList[key].push({[key]: String(sKey)});
							}	
						}
					})
				}
				this.getModel("filterListModel").setData(oFiltersList);
				
			} catch (oError) {
				console.error(oError);	
			} finally {
				this.getView().setBusy(false);
			}
			
			if (oSource) {
				oSource.update();
				oSource.setBusy(false);
			}
		}

	});
});