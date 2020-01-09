// @nearfile

import { context, PersistentVector } from "near-runtime-ts";

import { PostedMessage, EgressEvent, PaymentResult, State, META_CONTRACT } from "./model";

// --- contract code goes below

// The maximum number of latest messages the contract returns.
const MESSAGE_LIMIT = 10;

// collections.vector is a persistent collection. Any changes to it will
// be automatically saved in the storage.
// The parameter to the constructor needs to be unique across a single contract.
// It will be used as a prefix to all keys required to store data in the storage.
let messages = new PersistentVector<PostedMessage>("m");

// Adds a new message under the name of the sender's account id.
// NOTE: This is a change method. Which means it will modify the state.
// But right now we don't distinguish them with annotations yet.
export function addMessage(text: string): void {
  // Creating a new message and populating fields with our data
  let message: PostedMessage = {
    sender: context.sender,
    text: text
  };
  // Adding the message to end of the the persistent collection
  messages.push(message);
}

// Returns an array of last N messages.
// NOTE: This is a view method. Which means it should NOT modify the state.
export function getMessages(): Array<PostedMessage> {
  let numMessages = min(MESSAGE_LIMIT, messages.length);
  let startIndex = messages.length - numMessages;
  let result = Array.create<PostedMessage>(numMessages);
  for (let i = 0; i < numMessages; i++) {
    result[i] = messages[i + startIndex];
  }
  return result;
}

// --------------------------------

const GET_EVENT_LIMIT: u32 = 10;
const egressQueue = new PersistentVector<EgressEvent>("e");

// change method
export function pushCommand(contract: u32, payload: string): u32 {
  const eid = egressQueue.length as u32;
  let event: EgressEvent = {
    eid: eid,
    origin: context.sender,
    contract: contract,
    payload: payload,
    state: State.READY as u8
  };
  egressQueue.push(event);
  return eid;
}

// change method
export function setState(eid: u32, state: u8): void {
  if (state as i32 > State.MAX) {
    return;
  }
  if (eid >= (egressQueue.length as u32)) {
    return;
  }
  // TODO: check the bridge's identity (assert context.sender == 'xxx')
  const o = egressQueue[eid]
  egressQueue[eid] = {
    eid: o.eid,
    origin: o.origin,
    contract: o.contract,
    payload: o.payload,
    state: state
  }
}

export function pay(receiver: string, memo: string): PaymentResult {
  const unsafePayload: string = '{"Payment": {"token": "NEAR", "amount": "' + context.attachedDeposit.toString() + '", "receiver": "' + receiver + '" "memo": "' + memo + '" }}';
  const eid = pushCommand(META_CONTRACT, unsafePayload);

  // TODO: actual pay the deposit tokens to the receiver

  return {
    eid: eid,
    payload: unsafePayload
  };
}

// view method
export function getEvents(start: u32, length: u32): Array<EgressEvent> {
  assert(length <= GET_EVENT_LIMIT, "length out of range");
  let numEvents = min(egressQueue.length, length);
  let startIndex = start;
  let result = Array.create<EgressEvent>(numEvents);
  for (let i = 0; i < numEvents; i++) {
    result[i] = egressQueue[i + startIndex];
  }
  return result;
}
