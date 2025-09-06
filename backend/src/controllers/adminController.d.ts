import { Request, Response } from 'express';
interface AuthRequest extends Request {
    admin?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare const adminLogin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const adminLogout: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createNominationEvent: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getEvents: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateEventTimeSettings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createVotingEvent: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSystemActivities: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getVotingEvents: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getVotingResults: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateVotingEvent: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getNominationSuggestions: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getEventSubmissions: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const exportEventData: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateEvent: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteVotingEvent: (req: AuthRequest, res: Response) => Promise<void>;
export declare const extendVotingPeriod: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=adminController.d.ts.map