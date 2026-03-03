import { Request, Response } from "express";
import Version from "../models/Versions";

export const index = async (req: Request, res: Response): Promise<Response> => {
    const version = await Version.findByPk(1);
    // Retorna um valor padrão caso o registro não exista para evitar erro 500
    const value = version?.versionFrontend ?? "dev";
    return res.status(200).json({ version: value });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
    const value = req.body?.version ?? "dev";
    let version = await Version.findByPk(1);
    if (!version) {
        version = await Version.create({ id: 1, versionFrontend: value } as any);
    } else {
        version.versionFrontend = value;
        await version.save();
    }

    return res.status(200).json({
        version: version.versionFrontend
    });
};
