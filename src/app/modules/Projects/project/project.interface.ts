export interface IProjects {
  name: string;
  clientName: string;
  budget: number;
  duration: number; //in month
  salesName: string;
  googleSheetLink: string;
  teamGrouplink: string;
  status: IProjectStatus;
}

export enum IProjectStatus {
  COMPLETED = "COMPLETED",
  ONGOING = "ONGOING",
  CANCELED = "CANCELED",
  HOLD = "HOLD",
}
