import { Types } from "mongoose";

export interface IProjectValuationType {
  type: string;
  fixedPercent: number;
}

export interface IProjectValuation {
  project_valuation_type: Types.ObjectId;
  phase: IProjectValuationPhase;
  percent: number;
}

export enum IProjectValuationPhase {
  UI = "UI",
  APP_DESIGN = "App Design + Integration",
  WEB_DESIGN = "Website Design + Integration",
  DASHBOARD_DESIGN = "Dashboard Design + Integration",
  BACKEND = "Backend",
  AI = "AI",
  APP_DEPLOYMENT = "App Deployment",
  WEB_DEPLOYMENT = "Web Deployment",
  DEPLOYMENT = "Deployment",
}
