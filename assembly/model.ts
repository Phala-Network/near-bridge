// @nearfile

// Exporting a new class PostedMessage so it can be used outside of this file.
export class PostedMessage {
  sender: string;
  text: string;
}

export const META_CONTRACT: u32 = 0;

export enum State {
  READY = 0,
  PROCESSED = 1,
  MAX = 1,
};

export class EgressEvent {
  eid: u32;
  origin: string;
  contract: u32;
  payload: string;
  state: u8;
}

export class PaymentResult {
  eid: u32;
  payload: string;
};
