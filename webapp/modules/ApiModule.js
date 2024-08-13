sap.ui.define(["sap/ui/base/Object"], function (BaseObject) {
	"use strict";
	return BaseObject.extend("by.mda.bn.penalties.modules.ApiModule", {
		HTTP_METHODS: {
			GET: "GET",
			PUT: "PUT",
			POST: "POST",
			DELETE: "DELETE",
			OPTIONS: "OPTIONS",
		},

		BASE_URL: "/zehs/zapi_cntrlpoint/severities",

		constructor: function (oContext, oBundle) {
			this.oContext = oContext;
			this.oBundle = oBundle;
		},

		getBasePath: function () {
			return "";
		},

		getBaseToken: function () {
			const oHeader = { headers: { "x-csrf-token": "fetch" } };
			return new Promise((fnResolve, fnReject) => {
				fetch(`${this.BASE_URL}`, {
					method: this.HTTP_METHODS.GET,
					...oHeader,
				})
					.then((oResponse) => {
						fnResolve(oResponse.headers.get("x-csrf-token"));
					})
					.catch((oError) => {
						fnReject(oError);
					});
			});
		},

		fetchData: async function (
			sBaseUsrl,
			sEntity,
			sMethod = this.HTTP_METHODS.GET,
			oOptions = {}
		) {
			let sToken = "";
			if (sMethod !== this.HTTP_METHODS.GET) {
				sToken = await this.getBaseToken();
			}
			let sURL = `${sBaseUsrl}${sEntity}`;
			if (sMethod !== this.HTTP_METHODS.GET) {
				if (!oOptions.headers) {
					oOptions.headers = {};
				}
				oOptions.headers["x-csrf-token"] = sToken;
			}
			const oResponse = await fetch(this._getSapClientParamForUrl(sURL), {
				...oOptions,
				method: sMethod,
			});
			if (!oResponse.ok) {
				throw new Error(await oResponse.text());
			}
			return oResponse.text();
		},

		_fixDates: function (oEntity) {
			const aFields = ["CANCEL_DATE", "CR_DATE", "SANCTION_DATE"];
			aFields.forEach((sField) => {
				if (oEntity[sField]) {
					oEntity[sField] = this._shiftDateOffset(oEntity[sField]);
				}
			});
			return oEntity;
		},

		_shiftDateOffset: function (dDate) {
			const iOffset = dDate.getTimezoneOffset();
			const dNewDate = new Date(dDate.getTime() - iOffset * 60 * 1000);
			return dNewDate;
		},

		createEntity: async function (oSaveObject) {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_sanctions/`;
				let sResponce = await this.fetchData(
					sUrl,
					`sanctions`,
					this.HTTP_METHODS.POST,
					{
						body: JSON.stringify([this._fixDates(oSaveObject)]),
					}
				);
				return JSON.parse(sResponce);
			} catch (oError) {
				return null;
			} finally {
			}
		},

		editEntity: async function (oEditObject) {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_sanctions/`;
				let sResponce = await this.fetchData(
					sUrl,
					`sanctions`,
					this.HTTP_METHODS.PUT,
					{
						body: JSON.stringify([this._fixDates(oEditObject)]),
					}
				);
				return JSON.parse(sResponce);
			} catch (oError) {
				return null;
			} finally {
			}
		},

		deleteEntites: async function (aDeletedIds, aEntitiesToRemove) {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_sanctions/`;
				let sResponce = await this.fetchData(
					sUrl,
					`sanctions`,
					this.HTTP_METHODS.DELETE,
					{
						body: JSON.stringify(
							aDeletedIds.map((sId, i) => {
								const oEntity = aEntitiesToRemove[i];
								return {
									ID: sId,
									REC_ID: oEntity.REC_ID,
									EHFND_LOCATION: oEntity.EHFND_LOCATION,
									CNTRL_POINT: oEntity.CNTRL_POINT,
								};
							})
						),
					}
				);
				return true;
			} catch (oError) {
				return false;
			} finally {
			}
		},

		readData: async function (sFilter = "") {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_sanctions/`;
				let sResponce = await this.fetchData(sUrl, `sanctions${sFilter}`);
				let aJsonResp = JSON.parse(sResponce);
				let aParsedData = aJsonResp[0].SANCTIONS.map((oObject) => {
					return oObject;
				});
				this.oContext
					.getModel("appData")
					.setProperty("/tableData", aParsedData);
			} finally {
			}
		},

		readFilterData: async function (sFilter = "") {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_sanctions/`;
				let sResponce = await this.fetchData(sUrl, `sanctions${sFilter}`);
				let aJsonResp = JSON.parse(sResponce);
				let aParsedData = aJsonResp[0].SANCTIONS.map((oObject) => {
					return oObject;
				});
				return aParsedData;
			} catch (oError) {
				return null;
			} finally {
			}
		},

		readDataById: async function (sId) {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_sanctions/`;
				let sResponce = await this.fetchData(sUrl, `sanctions?id=${sId}`);
				let aJsonResp = JSON.parse(sResponce);
				return aJsonResp[0];
			} catch (oError) {
				return null;
			} finally {
			}
		},

		readUserCatalog: async function () {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_task_exec/`;
				let sResponce = await this.fetchData(sUrl, "user");
				let aJsonResp = JSON.parse(sResponce);
				let oUser = {
					RESP: aJsonResp.USER,
					RESP_TEXT: aJsonResp.USER_FIO,
					POST: aJsonResp.PLANS,
					POST_TEXT: aJsonResp.PLANS_TEXT,
				};
				return oUser;
			} catch (oError) {
				return null;
			} finally {
			}
		},

		readMagazineCatalog: async function (sRecId, sControlPoint) {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_task_exec/`;
				let sResponce = await this.fetchData(
					sUrl,
					`preventive_journal?id=${sRecId}`
				);
				let aJsonResp = JSON.parse(sResponce);
				return aJsonResp[0];
			} catch (oError) {
				return null;
			} finally {
			}
		},

		readPenTypesCatalog: async function () {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_sanctions/`;
				let sResponce = await this.fetchData(sUrl, "penalty");
				let aJsonResp = JSON.parse(sResponce);
				let aParsedData = aJsonResp.map((oObject) => {
					return {
						id: oObject.ID,
						name: oObject.VAL,
						desc: oObject.DESCRIPTION,
					};
				});
				this.oContext.getModel("appData").setProperty("/penTypes", aParsedData);
			} finally {
			}
		},

		readCompaniesCatalog: async function () {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_checklist/`;
				let sResponce = await this.fetchData(sUrl, "ke");
				let aJsonResp = JSON.parse(sResponce);
				let aParsedData = aJsonResp.map((oObject) => {
					return {
						id: oObject.ID,
						name: oObject.VAL,
					};
				});
				this.oContext
					.getModel("appData")
					.setProperty("/companies", aParsedData);
			} finally {
			}
		},

		readSeparateAssesCatalog: async function (sId) {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_checklist/`;
				let sResponce = await this.fetchData(sUrl, `hr_structure`);
				let aJsonResp = JSON.parse(sResponce);
				let aParsedData = aJsonResp.map((oObject) => {
					return {
						id: oObject.ID,
						name: oObject.VAL,
					};
				});
				this.oContext
					.getModel("appData")
					.setProperty("/separateAsses", aParsedData);
			} finally {
			}
		},

		readStructuralAssesCatalog: async function (sId) {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_checklist/`;
				let sResponce = await this.fetchData(sUrl, `hr_structure?id=${sId}`);
				let aJsonResp = JSON.parse(sResponce);
				let aParsedData = this._parseNodesData(
					this._createTreeStructure(aJsonResp)
				);
				this.oContext
					.getModel("appData")
					.setProperty("/structuralAsses", aParsedData);
			} finally {
			}
		},

		readMonitoringObjectsCatalog: async function (sStructuralAssId) {
			try {
				let sUrl = `${this.getBasePath()}/zehs/zapi_task_exec/`;
				let sResponce = await this.fetchData(
					sUrl,
					`mon_objs?org_unit=${sStructuralAssId}`
				);
				let aJsonResp = JSON.parse(sResponce);
				let aParsedData = aJsonResp.map((oObject) => {
					return {
						id: oObject.ID,
						name: oObject.REVISION_DESCR,
						mapId: oObject.KEY,
						type: oObject.TYPE,
						points: oObject.POINTS.map((oPoint) => {
							return {
								id: oPoint.KEY,
								mapId: oObject.KEY,
								name: oPoint.ATWRT,
							};
						}),
					};
				});
				this.oContext
					.getModel("appData")
					.setProperty("/monitoringObjects", aParsedData);
			} finally {
			}
		},

		_parseNodesData: function (aData) {
			return aData.map((oObject) => {
				return {
					id: oObject.ID,
					name: oObject.VAL,
					nodes: this._parseNodesData(oObject.nodes),
				};
			});
		},

		_createTreeStructure: function (aData) {
			const oOrg = {};
			const aTreeData = [];
			aData.forEach((oData) => {
				oOrg[oData.ID] = oData;
				oData.nodes = [];
			});

			aData.forEach((oData) => {
				const oStructData = oOrg[oData.R_OBJ_ID];
				if (!oStructData) {
					aTreeData.push(oData);
				} else {
					oStructData.nodes.push(oData);
				}
			});

			return aTreeData;
		},

		_getSapClientParamForUrl: function (sUrl) {
			return sUrl;
			const sSapClientParam = `sap-client=400&sap-language=ru`;
			const sSapClientUrl =
				sUrl + (sUrl.includes("?") ? "&" : "?") + sSapClientParam;
			return sSapClientUrl;
		},

		_getFormatDate: function (oDate) {
			let sDay = oDate.getDate() < 10 ? `0${oDate.getDate()}` : oDate.getDate();
			let sMonth =
				oDate.getMonth() < 9
					? `0${oDate.getMonth() + 1}`
					: oDate.getMonth() + 1;
			return `${oDate.getFullYear()}-${sMonth}-${sDay}T00:00:00.000Z`;
		},
	});
});
