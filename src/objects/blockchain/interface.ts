import * as net from "net";
export interface NewBlockRequest {
  voter: string;
  candidate: string;
  voteDate: Date;
  personalId: string;
}