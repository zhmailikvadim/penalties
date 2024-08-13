sap.ui.define([
    "./constants",
	"sap/ui/model/json/JSONModel",
], function (constants, JSONModel) {
	"use strict";

	return {
		
		createConfigModel: function(bVisible) {
			let oModel = new JSONModel({
				mainTable: {
					isMultiSelectedItem: false,
					isOneSelectedItem: false
				},
				state: "view",
				visibleDoc: {
					doc1: bVisible,
					doc2: bVisible,
					doc3: bVisible,
					doc4: bVisible
				},
				visibleEv: {
					doc1: bVisible,
					doc2: bVisible,
					doc3: bVisible,
					doc4: bVisible
				}
			});
			return oModel;
		},

		createMainEntity: function(bEdit, bExternal, oEditModel) {
			let aDocuments = bEdit && oEditModel.DOCUMENTS.length > 0 ? [...oEditModel.DOCUMENTS] : [];
			while (aDocuments.length < 5) {
				aDocuments.push({
					DOCUMENT_NAME: "",
					DOCUMENT_TYPE: "",
					DOCUMENT: ""
				});
			}

			let aEvidences = bEdit && oEditModel.EVIDENCES.length > 0 ? [...oEditModel.EVIDENCES] : [];
			while (aEvidences.length < 5) {
				aEvidences.push({
					EVIDENCE_NAME: "",
					EVIDENCE_TYPE: "",
					EVIDENCE: ""
				});
			}
			let oModel = new JSONModel({
				REC_ID: bEdit ? oEditModel.REC_ID : bExternal ? oEditModel.REC_ID : 0,
				ID: bEdit ? oEditModel.ID : 0,
				KOKRS: bEdit ? oEditModel.KOKRS : bExternal ? oEditModel.KOKRS : null,
				KOKRS_TEXT: bEdit ? oEditModel.KOKRS_TEXT : bExternal ? oEditModel.KOKRS_TEXT : "",
				BUKRS: bEdit ? oEditModel.BUKRS : bExternal ? oEditModel.BUKRS  : null,
				BUKRS_TEXT: bEdit ? oEditModel.BUKRS_TEXT : bExternal ? oEditModel.BUKRS_TEXT  : "",
				ORG_UNIT: bEdit ? oEditModel.ORG_UNIT : bExternal ? oEditModel.ORG_UNIT  : null,
				ORG_UNIT_TEXT: bEdit ? oEditModel.ORG_UNIT_TEXT : bExternal ? oEditModel.ORG_UNIT_TEXT  : "",
				EHFND_LOCATION: bEdit ? oEditModel.EHFND_LOCATION : bExternal ? oEditModel.EHFND_LOCATION  : null,
				REVISION_ID: bEdit ? oEditModel.REVISION_ID : bExternal ? oEditModel.REVISION_ID  : null,
				REVISION_ID_TEXT: bEdit ? oEditModel.REVISION_ID_TEXT : bExternal ? oEditModel.REVISION_ID_TEXT : "",
				CNTRL_POINT: bEdit ? oEditModel.CNTRL_POINT : bExternal ? oEditModel.CNTRL_POINT : null,
				UUID: bEdit ? oEditModel.UUID : bExternal ? oEditModel.UUID : null,
				CNTRL_POINT_TEXT: bEdit ? oEditModel.CNTRL_POINT_TEXT : bExternal ? oEditModel.CNTRL_POINT_TEXT : "",
				CR_DATE: bEdit ? new Date(oEditModel.CR_DATE) : new Date(),
				SANCTION_DATE: bEdit ? new Date(oEditModel.SANCTION_DATE) : new Date(),
				PEN_TYPE: bEdit ? oEditModel.PEN_TYPE : null,
				PEN_TYPE_TEXT: bEdit ? oEditModel.PEN_TYPE_TEXT : "",
				DESCRIPTION: bEdit ? oEditModel.DESCRIPTION : null,
				DOCUMENTS: aDocuments,
				RESP: oEditModel.RESP,
				RESP_TEXT: oEditModel.RESP_TEXT,
				POST: oEditModel.POST,
                POST_TEXT: oEditModel.POST_TEXT,
				CANCEL_SACTION: bEdit ? oEditModel.CANCEL_SACTION : false,
				CANCEL_DATE: bEdit ? new Date(oEditModel.CANCEL_DATE) : null,
				CANCEL_COMMENT: bEdit ? oEditModel.CANCEL_COMMENT : null,
				EVIDENCES: aEvidences
			});
			return oModel;
		}
    }
})