import { Request, Response } from 'express';
export declare const getVotingEventDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requestVotingOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const verifyVotingOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitVote: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=votingController.d.ts.map