import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await DashboardService.getStats(req.query, req.user!._id.toString());
    res.json(stats);
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

export const getCharts = async (req: Request, res: Response) => {
  try {
    const charts = await DashboardService.getCharts(req.query);
    res.json(charts);
  } catch (error) {
    console.error('Dashboard Charts Error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard charts' });
  }
};

export const getRecentData = async (req: Request, res: Response) => {
  try {
    const data = await DashboardService.getRecentData(req.query, req.user!._id.toString());
    res.json(data);
  } catch (error) {
    console.error('Dashboard Recent Data Error:', error);
    res.status(500).json({ message: 'Failed to fetch recent data' });
  }
};

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const results = await DashboardService.globalSearch(query);
    res.json(results);
  } catch (error) {
    console.error('Dashboard Search Error:', error);
    res.status(500).json({ message: 'Failed to perform search' });
  }
};
