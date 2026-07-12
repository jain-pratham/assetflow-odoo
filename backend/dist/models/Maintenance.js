"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const MaintenanceSchema = new mongoose_1.Schema({
    requestId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    assetId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset', required: true },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true },
    departmentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department', required: true },
    reportedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTechnicianId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM',
        required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
        type: String,
        enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'OPEN',
        required: true,
    },
    scheduledDate: { type: Date },
    completedDate: { type: Date },
    remarks: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });
MaintenanceSchema.index({ requestId: 1 });
MaintenanceSchema.index({ assetId: 1, status: 1 });
MaintenanceSchema.index({ departmentId: 1, status: 1 });
MaintenanceSchema.index({ reportedBy: 1, status: 1 });
MaintenanceSchema.index({ assignedTechnicianId: 1, status: 1 });
MaintenanceSchema.index({ title: 'text', description: 'text', requestId: 'text' });
exports.default = mongoose_1.default.model('Maintenance', MaintenanceSchema);
