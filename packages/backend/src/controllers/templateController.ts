import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { templateService } from '../services/templateService';

export const getAllTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const templates = templateService.getAllTemplates();

    res.json({
      success: true,
      data: { templates },
    });
  } catch (error) {
    throw error;
  }
};

export const getTemplateById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const template = templateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: { template },
    });
  } catch (error) {
    throw error;
  }
};

export const fillTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;

    const template = templateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    const filledTemplate = templateService.fillTemplate(template, variables || {});

    res.json({
      success: true,
      data: { template: filledTemplate },
    });
  } catch (error) {
    throw error;
  }
};
