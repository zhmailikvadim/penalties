sap.ui.define(
	[
		"./BaseController",
		".././models/models",
		".././models/formatter",
		".././modules/ApiModule",
		"sap/m/MessageToast",
		"sap/ui/core/Fragment",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageBox",
		"sap/ui/core/ValueState",
		"sap/ui/core/routing/History",
	],
	function (
		BaseController,
		models,
		Formatter,
		ApiModule,
		MessageToast,
		Fragment,
		JSONModel,
		MessageBox,
		ValueState,
		History
	) {
		"use strict";

		return BaseController.extend("by.mda.bn.penalties.controller.Detail", {
			formatter: Formatter,
			_bExternalState: false,

			onInit: function () {
				this.oBundle = this.getOwnerComponent()
					.getModel("i18n")
					.getResourceBundle();
				this.oRouter = this.getRouter();
				this.oApiModule = new ApiModule(this, this.oBundle);
				this.setModel(
					new JSONModel({
						companies: [],
						separateAsses: [],
						structuralAsses: [],
						monitoringObjects: [],
						controlPoints: [],
						penTypes: [],
						users: [],
					}),
					"appData"
				);
				this.oRouter
					.getRoute("Detail")
					.attachMatched(this._onDefaultRouteMatched, this);
				this.setModel(models.createConfigModel(false), "config");
			},

			onCancel: function () {
				this.oRouter.navTo("Default");
			},

			onSave: async function () {
				this.getView().setBusy(true);
				if (!this._validateSave()) {
					MessageBox.error(this.oBundle.getText("validateSaveErrorMessage"), {
						title: this.oBundle.getText("validateErrorTitle"),
						actions: [this.oBundle.getText("closeButton")],
						styleClass: "sapUiSizeCompact",
					});
					this.getView().setBusy(false);
					return;
				}

				let oSavedData = this.getModel("createEditModel").getData();
				oSavedData = this._deleteFreeFields(oSavedData);
				if (this.getModel("config").getProperty("/state") == "create") {
					try {
						delete oSavedData.ID;
						await this.oApiModule.createEntity(oSavedData);
						MessageToast.show(this.oBundle.getText("createComplete"));
						this._navBack();
					} catch (oError) {
						this.showAndLogParsedError(oError);
					}
				} else {
					let oSavedBackData = await this.oApiModule.editEntity(oSavedData);
					if (oSavedBackData) {
						MessageToast.show(this.oBundle.getText("editComplete"));
						this._navBack();
					} else {
						MessageBox.error(this.oBundle.getText("editProblems"), {
							title: this.oBundle.getText("editTitle"),
							actions: [this.oBundle.getText("closeButton")],
							styleClass: "sapUiSizeCompact",
						});
					}
				}
				this.getView().setBusy(false);
			},

			onPenInfo: function () {
				const oDocPenalty = this.getModel("createEditModel").getData();
				const aPenalty = this.getModel("appData").getProperty("/penTypes");
				const oChosen = aPenalty.find(
					(oItem) => oItem.id === oDocPenalty.PEN_TYPE
				);
				MessageBox.information(oChosen ? oChosen.desc : "");
			},

			onControlPointChange: async function (oEvent) {
				if (!this._oControlPointChangeDialog) {
					let that = this;
					let oView = this.getView();
					Fragment.load({
						id: oView.getId(),
						name: "by.mda.bn.penalties.fragment.contolPointTreeValueHelp",
						controller: that,
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						that._oControlPointChangeDialog = oDialog;
						that._oControlPointChangeDialog.open();
					});
				} else {
					this._oControlPointChangeDialog.open();
				}
			},

			onOkControlPoint: async function (oEvent) {
				let sPath = oEvent.getParameter("rowContext").getPath();
				let oItem = this.getModel("appData").getProperty(sPath);
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData();
				oModelData.CNTRL_POINT = oItem.id;
				oModelData.UUID = oItem.uuid
				oModelData.CNTRL_POINT_TEXT = oItem.name;
				oModelData.EHFND_LOCATION = oItem.mapId;
				oModel.refresh();
				this._oControlPointChangeDialog.close();
			},

			onCancelControlPoint: async function (oEvent) {
				this._oControlPointChangeDialog.close();
			},

			onMonitoringChange: async function (oEvent) {
				if (!this._oMonitoringChangeDialog) {
					let that = this;
					let oView = this.getView();
					Fragment.load({
						id: oView.getId(),
						name: "by.mda.bn.penalties.fragment.monitoringObjectTreeValueHelp",
						controller: that,
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						that._oMonitoringChangeDialog = oDialog;
						that._oMonitoringChangeDialog.open();
					});
				} else {
					this._oMonitoringChangeDialog.open();
				}
			},

			onOkMonitoring: async function (oEvent) {
				let sPath = oEvent.getParameter("rowContext").getPath();
				let oItem = this.getModel("appData").getProperty(sPath);
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData();
				oModelData.REVISION_ID = oItem.id;
				oModelData.REVISION_ID_TEXT = oItem.name;
				oModelData.CNTRL_POINT = null;
				oModelData.CNTRL_POINT_TEXT = "";
				oModel.refresh();
				let aPoints = Object.assign({}, oItem).points;
				this.getModel("appData").setProperty("/controlPoints", aPoints);
				this._oMonitoringChangeDialog.close();
			},

			onCancelMonitoring: async function (oEvent) {
				this._oMonitoringChangeDialog.close();
			},

			onCompanyChange: async function (oEvent) {
				if (!this._oCompanyChangeDialog) {
					let that = this;
					let oView = this.getView();
					Fragment.load({
						id: oView.getId(),
						name: "by.mda.bn.penalties.fragment.companyTreeValueHelp",
						controller: that,
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						that._oCompanyChangeDialog = oDialog;
						that._oCompanyChangeDialog.open();
					});
				} else {
					this._oCompanyChangeDialog.open();
				}
			},

			onOkCompany: async function (oEvent) {
				this.getView().setBusy(true);
				let sPath = oEvent.getParameter("rowContext").getPath();
				let oItem = this.getModel("appData").getProperty(sPath);
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData();
				oModelData.KOKRS = oItem.id;
				oModelData.KOKRS_TEXT = oItem.name;
				oModelData.BUKRS = null;
				oModelData.BUKRS_TEXT = "";
				oModel.refresh();
				await this.oApiModule.readSeparateAssesCatalog(oItem.id);
				this._oCompanyChangeDialog.close();
				this.getView().setBusy(false);
			},

			onCancelCompany: async function (oEvent) {
				this._oCompanyChangeDialog.close();
			},

			onSeparateAssChange: async function (oEvent) {
				if (!this._oSeparateChangeDialog) {
					let that = this;
					let oView = this.getView();
					Fragment.load({
						id: oView.getId(),
						name: "by.mda.bn.penalties.fragment.separateTreeValueHelp",
						controller: that,
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						that._oSeparateChangeDialog = oDialog;
						that._oSeparateChangeDialog.open();
					});
				} else {
					this._oSeparateChangeDialog.open();
				}
			},

			onOkSeparate: async function (oEvent) {
				this.getView().setBusy(true);
				let sPath = oEvent.getParameter("rowContext").getPath();
				let oItem = this.getModel("appData").getProperty(sPath);
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData();
				oModelData.BUKRS = oItem.id;
				oModelData.BUKRS_TEXT = oItem.name;
				oModelData.ORG_UNIT = null;
				oModelData.ORG_UNIT_TEXT = "";
				oModel.refresh();
				await this.oApiModule.readStructuralAssesCatalog(oItem.id);
				this._oSeparateChangeDialog.close();
				this.getView().setBusy(false);
			},

			onCancelSeparate: async function (oEvent) {
				this._oSeparateChangeDialog.close();
			},

			onOkStructural: async function (oEvent) {
				this.getView().setBusy(true);
				let sPath = oEvent.getParameter("rowContext").getPath();
				let oItem = this.getModel("appData").getProperty(sPath);
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData();
				oModelData.ORG_UNIT = oItem.id;
				oModelData.ORG_UNIT_TEXT = oItem.name;
				oModelData.REVISION_ID = null;
				oModelData.REVISION_ID_TEXT = "";
				oModel.refresh();
				await this.oApiModule.readMonitoringObjectsCatalog(oItem.id);
				this._oStructuralChangeDialog.close();
				this.getView().setBusy(false);
			},

			onCancelStructural: function () {
				this._oStructuralChangeDialog.close();
			},

			onChangeStructural: function () {
				if (!this._oStructuralChangeDialog) {
					let that = this;
					let oView = this.getView();
					Fragment.load({
						id: oView.getId(),
						name: "by.mda.bn.penalties.fragment.structuralTreeValueHelp",
						controller: that,
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						that._oStructuralChangeDialog = oDialog;
						that._oStructuralChangeDialog.open();
					});
				} else {
					this._oStructuralChangeDialog.open();
				}
			},

			onPenTypeChange: async function (oEvent) {
				if (!this._oPenTypeChangeDialog) {
					let that = this;
					let oView = this.getView();
					Fragment.load({
						id: oView.getId(),
						name: "by.mda.bn.penalties.fragment.penTypeTreeValueHelp",
						controller: that,
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						that._oPenTypeChangeDialog = oDialog;
						that._oPenTypeChangeDialog.open();
					});
				} else {
					this._oPenTypeChangeDialog.open();
				}
			},

			onOkPenType: async function (oEvent) {
				let sPath = oEvent.getParameter("rowContext").getPath();
				let oItem = this.getModel("appData").getProperty(sPath);
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData();
				oModelData.PEN_TYPE = oItem.id;
				oModelData.PEN_TYPE_TEXT = oItem.name;
				oModel.refresh();
				this._oPenTypeChangeDialog.close();
			},

			onCancelPenType: async function (oEvent) {
				this._oPenTypeChangeDialog.close();
			},

			onUserChange: async function (oEvent) {
				if (!this._oUserChangeDialog) {
					let that = this;
					let oView = this.getView();
					Fragment.load({
						id: oView.getId(),
						name: "by.mda.bn.penalties.fragment.userTreeValueHelp",
						controller: that,
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						that._oUserChangeDialog = oDialog;
						that._oUserChangeDialog.open();
					});
				} else {
					this._oUserChangeDialog.open();
				}
			},

			onOkUser: async function (oEvent) {
				let sPath = oEvent.getParameter("rowContext").getPath();
				let oItem = this.getModel("appData").getProperty(sPath);
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData();
				oModelData.RESP = oItem.RESP;
				oModelData.RESP_TEXT = oItem.FIO;
				oModelData.POST = oItem.POST;
				oModelData.POST_TEXT = oItem.POST_TEXT;
				oModel.refresh();
				this._oUserChangeDialog.close();
			},

			onCancelUser: async function (oEvent) {
				this._oUserChangeDialog.close();
			},

			onUploadDocumentFile: function (oEvent) {
				this._uploadDocumentFile(0, oEvent);
				this.getModel("config").setProperty("/visibleDoc/doc1", true);
			},

			onDownloadDocumentFile: function (oEvent) {
				this._downloadDocumentFile(0);
			},

			onClearDocumentFile: function () {
				this._clearDocumentFile(0);
			},

			onUploadDocumentFile1: function (oEvent) {
				this._uploadDocumentFile(1, oEvent);
				this.getModel("config").setProperty("/visibleDoc/doc2", true);
			},

			onDownloadDocumentFile1: function (oEvent) {
				this._downloadDocumentFile(1);
			},

			onClearDocumentFile1: function () {
				this._clearDocumentFile(1);
			},

			onUploadDocumentFile2: function (oEvent) {
				this._uploadDocumentFile(2, oEvent);
				this.getModel("config").setProperty("/visibleDoc/doc3", true);
			},

			onDownloadDocumentFile2: function (oEvent) {
				this._downloadDocumentFile(2);
			},

			onClearDocumentFile2: function () {
				this._clearDocumentFile(2);
			},

			onUploadDocumentFile3: function (oEvent) {
				this._uploadDocumentFile(3, oEvent);
				this.getModel("config").setProperty("/visibleDoc/doc4", true);
			},

			onDownloadDocumentFile3: function (oEvent) {
				this._downloadDocumentFile(3);
			},

			onClearDocumentFile3: function () {
				this._clearDocumentFile(3);
			},

			onUploadDocumentFile4: function (oEvent) {
				this._uploadDocumentFile(4, oEvent);
			},

			onDownloadDocumentFile4: function (oEvent) {
				this._downloadDocumentFile(4);
			},

			onClearDocumentFile4: function () {
				this._clearDocumentFile(4);
			},

			_uploadDocumentFile: function (iIndex, oEvent) {
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData().DOCUMENTS[iIndex];
				let oFile =
					oEvent.getParameter("files") && oEvent.getParameter("files")[0];
				if (!oFile) {
					return;
				}
				oModelData.DOCUMENT_NAME = oFile.name;
				oModelData.DOCUMENT_TYPE = oFile.type;
				if (oFile && window.FileReader) {
					let oReader = new FileReader();
					oReader.readAsDataURL(oFile);
					oReader.onload = (oEvn) => {
						let oBuffData = oReader.result;
						oModelData.DOCUMENT = oBuffData;
					};
				}
				oModel.refresh();
			},

			_downloadDocumentFile: function (iIndex) {
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData().DOCUMENTS[iIndex];
				this._downloadFile(oModelData.DOCUMENT, oModelData.DOCUMENT_NAME);
			},

			_clearDocumentFile: function (iIndex) {
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData().DOCUMENTS[iIndex];
				oModelData.DOCUMENT_NAME = "";
				oModelData.DOCUMENT_TYPE = "";
				oModelData.DOCUMENT = "";
				oModel.refresh();
			},

			onUploadDocumentCancelFile: function (oEvent) {
				this._uploadDocumentCancelFile(0, oEvent);
				this.getModel("config").setProperty("/visibleEv/doc1", true);
			},

			onDownloadDocumentCancelFile: function () {
				this._downloadDocumentCancelFile(0);
			},

			onClearDocumentCancelFile: function () {
				this._clearDocumentCancelFile(0);
			},

			onUploadDocumentCancelFile1: function (oEvent) {
				this._uploadDocumentCancelFile(1, oEvent);
				this.getModel("config").setProperty("/visibleEv/doc2", true);
			},

			onDownloadDocumentCancelFile1: function () {
				this._downloadDocumentCancelFile(1);
			},

			onClearDocumentCancelFile1: function () {
				this._clearDocumentCancelFile(1);
			},

			onUploadDocumentCancelFile2: function (oEvent) {
				this._uploadDocumentCancelFile(2, oEvent);
				this.getModel("config").setProperty("/visibleEv/doc3", true);
			},

			onDownloadDocumentCancelFile2: function () {
				this._downloadDocumentCancelFile(2);
			},

			onClearDocumentCancelFile2: function () {
				this._clearDocumentCancelFile(2);
			},

			onUploadDocumentCancelFile3: function (oEvent) {
				this._uploadDocumentCancelFile(3, oEvent);
				this.getModel("config").setProperty("/visibleEv/doc4", true);
			},

			onDownloadDocumentCancelFile3: function () {
				this._downloadDocumentCancelFile(3);
			},

			onClearDocumentCancelFile3: function () {
				this._clearDocumentCancelFile(3);
			},

			onUploadDocumentCancelFile4: function (oEvent) {
				this._uploadDocumentCancelFile(4, oEvent);
			},

			onDownloadDocumentCancelFile4: function () {
				this._downloadDocumentCancelFile(4);
			},

			onClearDocumentCancelFile4: function () {
				this._clearDocumentCancelFile(4);
			},

			_uploadDocumentCancelFile: function (iIndex, oEvent) {
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData().EVIDENCES[iIndex];
				let oFile =
					oEvent.getParameter("files") && oEvent.getParameter("files")[0];
				oModelData.EVIDENCE_NAME = oFile.name;
				oModelData.EVIDENCE_TYPE = oFile.type;
				if (oFile && window.FileReader) {
					let oReader = new FileReader();
					oReader.readAsDataURL(oFile);
					oReader.onload = (oEvn) => {
						let oBuffData = oReader.result;
						oModelData.EVIDENCE = oBuffData;
					};
				}
				oModel.refresh();
			},

			_downloadDocumentCancelFile: function (iIndex) {
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData().EVIDENCES[iIndex];
				this._downloadFile(oModelData.EVIDENCE, oModelData.EVIDENCE_NAME);
			},

			_clearDocumentCancelFile: function (iIndex) {
				let oModel = this.getModel("createEditModel");
				let oModelData = oModel.getData().EVIDENCES[iIndex];
				oModelData.EVIDENCE_NAME = "";
				oModelData.EVIDENCE_TYPE = "";
				oModelData.EVIDENCE = "";
				oModel.refresh();
			},

			handleTypeMissmatch: function (oEvent) {
				let aFileTypes = oEvent.getSource().getFileType();
				jQuery.each(aFileTypes, (sKey, sValue) => {
					aFileTypes[sKey] = "*." + sValue;
				});
				let sSupportedFileTypes = aFileTypes.join(", ");
				MessageToast.show(
					this.oBundle.getText("fileUploadType", [
						oEvent.getParameter("fileType"),
						sSupportedFileTypes,
					])
				);
			},

			_downloadFile: function (sBase64, sFileName) {
				let vA = document.createElement("a");
				document.body.appendChild(vA);
				vA.href = sBase64;
				vA.download = sFileName;
				vA.click();
				document.body.removeChild(vA);
			},

			_onDefaultRouteMatched: async function (oEvent) {
				this.getOwnerComponent()
					.getService("ShellUIService")
					.then((oShellService) => {
						oShellService.setBackNavigation(() => {
							if (this._bExternalState) {
								sap.m.URLHelper.redirect(
									`${
										window.location.href.split("#")[0]
									}#Z_EHS_LOGPWOT-manage&/Detail/edit/${this.sId}`,
									false
								);
							} else {
								this._navBack();
							}
						});
					});

				try {
					this.getView().setBusy(true);

					this._clearSaveValidate();
					let bCreate = true;
					let bExternal = false;
					let oParams = oEvent.getParameter("arguments");
					this.sId = oParams.id;
					this.sIdPoint = oParams.point_id;
					this.sUUID = oParams.uuid;
					await this.oApiModule.readPenTypesCatalog();
					await this.oApiModule.readCompaniesCatalog();
					switch (oParams.mode) {
						case "create":
							this._navBack();
							this.getModel("config").setProperty("/state", "create");
							break;
						case "edit":
							bCreate = false;
							this.getModel("config").setProperty("/state", "edit");
							break;
						case "view":
							bCreate = false;
							this.getModel("config").setProperty("/state", "view");
							break;
						case "external":
							this.getModel("config").setProperty("/state", "create");
							bExternal = true;
							break;
					}
					if (bCreate && !bExternal) {
						let oUser = await this.oApiModule.readUserCatalog();
						this.setModel(
							models.createMainEntity(false, false, oUser),
							"createEditModel"
						);
						this.getModel("config").setProperty("/visibleDoc", {
							doc1: false,
							doc2: false,
							doc3: false,
							doc4: false,
						});
						this.getModel("config").setProperty("/visibleEv", {
							doc1: false,
							doc2: false,
							doc3: false,
							doc4: false,
						});
					} else if (bCreate && bExternal) {
						this._bExternalState = true;
						let oEntity = await this.oApiModule.readMagazineCatalog(
							this.sId,
							this.sIdPoint
						);
						let oCreateModel = {
							REC_ID: oEntity.ID,
							KOKRS: oEntity.KOKRS,
							KOKRS_TEXT: oEntity.KOKRS_TEXT.VALUE,
							BUKRS: oEntity.BUKRS,
							BUKRS_TEXT: oEntity.BUKRS_TEXT.VALUE,
							ORG_UNIT: oEntity.ORG_UNIT,
							ORG_UNIT_TEXT: oEntity.ORGEH_TEXT.VALUE,
							EHFND_LOCATION: oEntity.LOCATION.KEY,
							CNTRL_POINT: this.sIdPoint,
							UUID: this.sUUID,
							RESP: oEntity.BNAME_TEXT.KEY,
							RESP_TEXT: oEntity.BNAME_TEXT.VALUE,
							POST: oEntity.PLANS_TEXT.KEY,
							POST_TEXT: oEntity.PLANS_TEXT.VALUE,
						};
						await this.oApiModule.readSeparateAssesCatalog(oCreateModel.KOKRS);
						await this.oApiModule.readStructuralAssesCatalog(
							oCreateModel.BUKRS
						);
						await this.oApiModule.readMonitoringObjectsCatalog(
							oCreateModel.ORG_UNIT
						);
						let aMonObjs =
							this.getModel("appData").getProperty("/monitoringObjects");
						let aPoints = [];

						const oControlPoint = oEntity.CONTROL_POINTS.find(
							(oPoint) => oPoint.CNTRL_POINT == this.sIdPoint && oPoint.UUID == this.sUUID
						);
						if (oControlPoint) {
							oCreateModel.REVISION_ID = oControlPoint.EHFND_LOCATION_TEXT.KEY;
							oCreateModel.REVISION_ID_TEXT =
								oControlPoint.EHFND_LOCATION_TEXT.VALUE;
							oCreateModel.EHFND_LOCATION =
								oControlPoint.EHFND_LOCATION_TEXT.KEY;

							oCreateModel.CNTRL_POINT = oControlPoint.CONTROL_POINT.KEY;
							oCreateModel.CNTRL_POINT_TEXT = oControlPoint.CONTROL_POINT.VALUE;
						}

						aMonObjs.map((oMonObj) => {
							if (oMonObj.mapId == oCreateModel.EHFND_LOCATION) {
								// oCreateModel.REVISION_ID = oMonObj.id;
								// oCreateModel.REVISION_ID_TEXT = oMonObj.name;
								aPoints = Object.assign({}, oMonObj).points;
								aPoints.map((oPoint) => {
									if (oPoint.id == this.sIdPoint) {
										// oCreateModel.CNTRL_POINT_TEXT = oPoint.name;
									}
								});
							}
						});
						this.getModel("appData").setProperty("/controlPoints", aPoints);
						this.getModel("config").setProperty("/visibleDoc", {
							doc1: false,
							doc2: false,
							doc3: false,
							doc4: false,
						});
						this.getModel("config").setProperty("/visibleEv", {
							doc1: false,
							doc2: false,
							doc3: false,
							doc4: false,
						});
						this.setModel(
							models.createMainEntity(false, true, oCreateModel),
							"createEditModel"
						);
					} else {
						let oLoadedData = await this.oApiModule.readDataById(oParams.id);
						let oEditedObj = oLoadedData.SANCTIONS[0];
						if (!oEditedObj) {
							MessageToast.show(this.oBundle.getText("errorReadEntityById"));
							this._navBack();
						}
						this.getModel("appData").setProperty(
							"/users",
							oLoadedData.LOG_PERS[0]
						);
						await this.oApiModule.readSeparateAssesCatalog(oEditedObj.KOKRS);
						await this.oApiModule.readStructuralAssesCatalog(oEditedObj.BUKRS);
						await this.oApiModule.readMonitoringObjectsCatalog(
							oEditedObj.ORG_UNIT
						);
						this.getModel("config").setProperty("/visibleDoc", {
							doc1: oEditedObj.DOCUMENTS.length > 1,
							doc2: oEditedObj.DOCUMENTS.length > 2,
							doc3: oEditedObj.DOCUMENTS.length > 3,
							doc4: oEditedObj.DOCUMENTS.length > 4,
						});
						this.getModel("config").setProperty("/visibleEv", {
							doc1: oEditedObj.EVIDENCES.length > 1,
							doc2: oEditedObj.EVIDENCES.length > 2,
							doc3: oEditedObj.EVIDENCES.length > 3,
							doc4: oEditedObj.EVIDENCES.length > 4,
						});
						this.setModel(
							models.createMainEntity(true, false, oEditedObj),
							"createEditModel"
						);
					}

					if (oParams.mode === "edit") {
						const aLocked = JSON.parse(
							await this.fetchDataWithoutBaseUrl(
								`/zehs/zapi_task_exec/locked_records?id=${this.sId}&type=ZEHS_SANCTIONS`
							)
						);

						const oUserData = JSON.parse(
							await this.fetchDataWithoutBaseUrl(`/zehs/zapi_task_exec/user`)
						);
						this.oUserID = oUserData;

						const oSomeLock = aLocked.some((oItem) =>
							this._checkUser(oItem.UNAME)
						);

						if (oSomeLock) {
							this.getModel("config").setProperty("/state", "view");
							MessageBox.alert(
								this.getResourceBundle().getText("locked", [
									aLocked[0].UNAME,
									aLocked[0].TIMESTAMP,
								])
							);
						} else {
							try {
								await this.fetchDataWithoutBaseUrl(
									`/zehs/zapi_task_exec/locked_records?action=lock`,
									"PUT",
									{
										body: JSON.stringify([
											{ id: +this.sId, type: "ZEHS_SANCTIONS" },
										]),
									}
								);
							} catch (oLockError) {
								this.showAndLogParsedError("errorLock", oLockError);
								this.getModel("config").setProperty("/state", "view");
							}
						}
					}
				} catch (oError) {
					this.showAndLogParsedError("erorrLoadData", oError);
					this.getModel("config").setProperty("/state", "view");
				} finally {
					this.getView().setBusy(false);
				}
			},

			_navBack: async function () {
				const oConfigData = this.getModelData("config");
				const sMode = oConfigData.state;

				if (sMode === "edit") {
					try {
						this.getView().setBusy(true);

						await this.fetchDataWithoutBaseUrl(
							`/zehs/zapi_task_exec/locked_records?action=unlock`,
							"PUT",
							{
								body: JSON.stringify([
									{ id: +this.sId, type: "ZEHS_SANCTIONS" },
								]),
							}
						);
					} catch (oError) {
						this.showAndLogParsedError("erorrUnlock", oError);
					} finally {
						this.getView().setBusy(false);
					}
				}

				const oHistory = History.getInstance();
				const sPreviousHash = oHistory.getPreviousHash();

				if (sPreviousHash !== undefined) {
					window.history.go(-1);
				} else {
					this.oRouter.navTo("Default");
				}
			},

			_checkUser: function (sUser) {
				if (sUser !== this.oUserID.USER) {
					if (
						!!this.oUserID.SUBSTITUTES.find((oUser) => oUser.USER === sUser)
					) {
						return false;
					}
					return true;
				}
				return false;
			},

			_deleteFreeFields: function (oSavedObject) {
				if (oSavedObject.REC_ID == 0) {
					delete oSavedObject.REC_ID;
				}
				if (oSavedObject.DESCRIPTION == null) {
					delete oSavedObject.DESCRIPTION;
				}
				let aDocuments = [];
				oSavedObject.DOCUMENTS.map((oDoc) => {
					if (oDoc.DOCUMENT !== "") {
						aDocuments.push(oDoc);
					}
				});
				oSavedObject.DOCUMENTS = [...aDocuments];
				if (oSavedObject.CANCEL_DATE == null) {
					delete oSavedObject.CANCEL_DATE;
				}
				if (oSavedObject.CANCEL_COMMENT == null) {
					delete oSavedObject.CANCEL_COMMENT;
				}
				let aEvidences = [];
				oSavedObject.EVIDENCES.map((oDoc) => {
					if (oDoc.EVIDENCE !== "") {
						aEvidences.push(oDoc);
					}
				});
				oSavedObject.EVIDENCES = [...aEvidences];
				return oSavedObject;
			},

			_clearSaveValidate: function () {
				this._setStateByID(ValueState.None, "companyControlID");
				this._setStateByID(ValueState.None, "separateAssControlID");
				this._setStateByID(ValueState.None, "structuralAssControlID");
				this._setStateByID(ValueState.None, "monitoringObjectControlID");
				this._setStateByID(ValueState.None, "controlPointID");
				this._setStateByID(ValueState.None, "dateSanctionId");
				this._setStateByID(ValueState.None, "penTypeID");
				this._setStateByID(ValueState.None, "createUserID");
			},

			_validateSave: function () {
				let oModelData = this.getModel("createEditModel").getData();
				let bState = true;
				this._clearSaveValidate();
				if (!oModelData.KOKRS) {
					bState = false;
					this._setStateByID(ValueState.Error, "companyControlID");
				}
				if (!oModelData.BUKRS) {
					bState = false;
					this._setStateByID(ValueState.Error, "separateAssControlID");
				}
				if (!oModelData.ORG_UNIT) {
					bState = false;
					this._setStateByID(ValueState.Error, "structuralAssControlID");
				}
				if (!oModelData.REVISION_ID) {
					bState = false;
					this._setStateByID(ValueState.Error, "monitoringObjectControlID");
				}
				if (!oModelData.CNTRL_POINT) {
					bState = false;
					this._setStateByID(ValueState.Error, "controlPointID");
				}
				if (!oModelData.UUID) {
					bState = false;
					this._setStateByID(ValueState.Error, "controlPointID");
				}
				if (!oModelData.CR_DATE) {
					bState = false;
					this._setStateByID(ValueState.Error, "dateSanctionId");
				}
				if (!oModelData.PEN_TYPE) {
					bState = false;
					this._setStateByID(ValueState.Error, "penTypeID");
				}
				if (!oModelData.RESP) {
					bState = false;
					this._setStateByID(ValueState.Error, "createUserID");
				}
				return bState;
			},

			_setStateByID: function (sState, sId) {
				this.byId(sId).setValueState(sState);
			},
		});
	}
);
