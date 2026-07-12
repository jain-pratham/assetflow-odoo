"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const reports_service_1 = require("../services/reports.service");
const apiResponse_1 = require("../utils/apiResponse");
const User_1 = require("../models/User");
function getRoleQueries(user) {
    const role = user.role;
    let roleQuery = {};
    let assetQuery = {};
    if (role === User_1.UserRole.DEPARTMENT_HEAD) {
        roleQuery = { departmentId: user.departmentId };
        assetQuery = { department: user.departmentId };
    }
    else if (role === User_1.UserRole.EMPLOYEE) {
        roleQuery = { employeeId: user._id };
        assetQuery = { assignedTo: user._id };
    }
    return { roleQuery, assetQuery };
}
class ReportsController {
    static getDashboard = async (req, res) => {
        try {
            const { roleQuery, assetQuery } = getRoleQueries(req.user);
            const stats = await reports_service_1.ReportsService.getDashboardStats(roleQuery, assetQuery);
            return res.status(200).json((0, apiResponse_1.successResponse)('Dashboard stats retrieved', stats));
        }
        catch (error) {
            console.error(error);
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch dashboard stats'));
        }
    };
    static getCharts = async (req, res) => {
        try {
            const { roleQuery, assetQuery } = getRoleQueries(req.user);
            const charts = await reports_service_1.ReportsService.getCharts(roleQuery, assetQuery);
            return res.status(200).json((0, apiResponse_1.successResponse)('Charts retrieved', charts));
        }
        catch (error) {
            console.error(error);
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch charts'));
        }
    };
    static getAssetReport = async (req, res) => {
        try {
            const { assetQuery } = getRoleQueries(req.user);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const query = { ...assetQuery };
            if (req.query.search)
                query.name = { $regex: req.query.search, $options: 'i' };
            if (req.query.status)
                query.status = req.query.status;
            if (req.query.departmentId)
                query.department = req.query.departmentId;
            if (req.query.categoryId)
                query.category = req.query.categoryId;
            const { data, total } = await reports_service_1.ReportsService.getAssetsReport(query, limit, (page - 1) * limit);
            return res.status(200).json((0, apiResponse_1.successResponse)('Asset report retrieved', data, { total, page, pages: Math.ceil(total / limit) || 1 }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch asset report'));
        }
    };
    static getBookingReport = async (req, res) => {
        try {
            const { roleQuery } = getRoleQueries(req.user);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const query = { ...roleQuery };
            if (req.query.status)
                query.status = req.query.status;
            if (req.query.departmentId)
                query.departmentId = req.query.departmentId;
            const { data, total } = await reports_service_1.ReportsService.getBookingsReport(query, limit, (page - 1) * limit);
            return res.status(200).json((0, apiResponse_1.successResponse)('Booking report retrieved', data, { total, page, pages: Math.ceil(total / limit) || 1 }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch booking report'));
        }
    };
    static getMaintenanceReport = async (req, res) => {
        try {
            const { roleQuery } = getRoleQueries(req.user); // Using same role override (technician/dept)
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const query = { ...roleQuery };
            if (req.query.status)
                query.status = req.query.status;
            if (req.query.priority)
                query.priority = req.query.priority;
            const { data, total } = await reports_service_1.ReportsService.getMaintenanceReport(query, limit, (page - 1) * limit);
            return res.status(200).json((0, apiResponse_1.successResponse)('Maintenance report retrieved', data, { total, page, pages: Math.ceil(total / limit) || 1 }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch maintenance report'));
        }
    };
    static getAuditReport = async (req, res) => {
        try {
            const { roleQuery } = getRoleQueries(req.user);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const query = { ...roleQuery };
            if (req.query.status)
                query.status = req.query.status;
            if (req.query.departmentId)
                query.departmentId = req.query.departmentId;
            const { data, total } = await reports_service_1.ReportsService.getAuditReport(query, limit, (page - 1) * limit);
            return res.status(200).json((0, apiResponse_1.successResponse)('Audit report retrieved', data, { total, page, pages: Math.ceil(total / limit) || 1 }));
        }
        catch (error) {
            return res.status(500).json((0, apiResponse_1.errorResponse)('Failed to fetch audit report'));
        }
    };
}
exports.ReportsController = ReportsController;
