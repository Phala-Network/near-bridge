describe('Guestbook', function () {
  let near;
  let contract;
  let accountId;

  beforeAll(async function () {
    near = await nearlib.connect(nearConfig);
    accountId = nearConfig.contractName;
    contract = await near.loadContract(nearConfig.contractName, {
      // NOTE: This configuration only needed while NEAR is still in development
      viewMethods: ['getMessages', 'getEvents'],
      changeMethods: ['addMessage', 'pushCommand', 'setState', 'pay'],
      sender: accountId
    });
  });

  describe('Guestbook', function () {
    it('returns 0 messages in initial empty states', async function () {
      const messages = await contract.getMessages({});
      expect(messages.length).toBe(0);
    });

    it('has correct state after pushing a command', async function () {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
      const eid = await contract.pushCommand({
        contract: 1,
        payload: 'this is a payload'
      })

      const events1 = await contract.getEvents({start: eid, length: 10});
      expect(events1.length).toBeGreaterThanOrEqual(1);
      const ev1 = events1[0];
      expect(ev1.eid).toBe(0);
      expect(ev1.state).toBe(0);  // 0 is READY

      await contract.setState({eid: eid, state: 1}); // 1 is PROCESSED

      const events2 = await contract.getEvents({start: eid, length: 10});
      expect(events2.length).toBeGreaterThanOrEqual(1);
      const ev2 = events2[0];
      expect(ev2.eid).toBe(0);
      expect(ev2.state).toBe(1);  // 1 is PROCESSED

    }, 15000);

    it('emit correct payment egress event', async function () {
      const gas = 1e14;
      const amount = 10;
      const result = await contract.pay({receiver: 'vitalik', memo: 'eth airdrop'}, gas, amount);
      expect(result.payload).toBe('{"Payment": {"token": "NEAR", "amount": "10", "receiver": "vitalik" "memo": "eth airdrop" }}');
    }, 10000);

  });
});