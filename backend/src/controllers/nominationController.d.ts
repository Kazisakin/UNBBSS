import { Request, Response } from 'express';
export declare const requestOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const verifyOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitNomination: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getEventDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=nominationController.d.ts.map