/* 
let database = {
	users: {
		username: {
            'name': name,
            'registered': false,
            'id': id,
            'authenticators': [],
            'oneTimeToken': undefined,
            'recoveryEmail': undefined
        }
	}
};
*/
/*
let database = {
  "c": {
    "foo": {
      "name": "foo",
      "registered": true,
      "id": "2x-TbRre4iU7HVX2psD3xmR5wuy7lpKgTb6MLR_GdJI",
      "authenticators": [
        {
          "id": "KInMRynZifaMleaY-4vF7ATX68b2nhd8FlceWEzbpQs",
          "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo7mVhYJzMoIiz9oqneIt\nJUJ+ji9vqTf1nzoAdS/uo6vkrAprs6TOwJ+a9Li8rvAexYvMnXkL1I0ZkXtg3+Qd\nJ9MroC5YT193RosJ3YTFUgmPrOKDusTlGbZoRqAeFLcyuZEbrG5XZkCvEPRoICgS\nEgAf2tj2jZpr7QQoArUMsJsyiED91wLwnFkDNMR52lLzV69b8N0/37HCTxJCB4+u\nuZ7+JAoF1LsdKqfMqkE2/9ph2jQkIPvnSotid9nmdxLmpJ+3zZyRHVuIANtb08Im\nnRSxjI9v6vQU1fjinwGe9w+fOnNjVIjPec9V3+WeRiewBEIuEKQYRH1tJiQ5+BFm\nCwIDAQAB\n-----END PUBLIC KEY-----\n",
          "type": "public-key",
          "counter": 0,
        },
        {
          "id": "ATJz4uGoS09XONMMoGpl5agw98HLHJJcN2_vvbEs3sBlSNEhqD_TjFagXubmPuxGn5jJX4klN20qu3fFeNFM9wQ",
          "publicKey": "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAENRxgrWRLveFVNDpTOypUmCI9GitD\n5sVDuS7S5ZvYCxx96dhLD4SUvN6jU2lN9QzYMPtC0NgPSBYASIyBybDGAA==\n-----END PUBLIC KEY-----\n",
          "type": "public-key",
          "counter": 0,
        }
      ]
    }
  }
}
*/
let database = [
	{
		"id": "KInMRynZifaMleaY-4vF7ATX68b2nhd8FlceWEzbpQs",
		"publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo7mVhYJzMoIiz9oqneIt\nJUJ+ji9vqTf1nzoAdS/uo6vkrAprs6TOwJ+a9Li8rvAexYvMnXkL1I0ZkXtg3+Qd\nJ9MroC5YT193RosJ3YTFUgmPrOKDusTlGbZoRqAeFLcyuZEbrG5XZkCvEPRoICgS\nEgAf2tj2jZpr7QQoArUMsJsyiED91wLwnFkDNMR52lLzV69b8N0/37HCTxJCB4+u\nuZ7+JAoF1LsdKqfMqkE2/9ph2jQkIPvnSotid9nmdxLmpJ+3zZyRHVuIANtb08Im\nnRSxjI9v6vQU1fjinwGe9w+fOnNjVIjPec9V3+WeRiewBEIuEKQYRH1tJiQ5+BFm\nCwIDAQAB\n-----END PUBLIC KEY-----\n",
		"type": "public-key",
		"counter": 0,
	},
	{
		"id": "ATJz4uGoS09XONMMoGpl5agw98HLHJJcN2_vvbEs3sBlSNEhqD_TjFagXubmPuxGn5jJX4klN20qu3fFeNFM9wQ",
		"publicKey": "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAENRxgrWRLveFVNDpTOypUmCI9GitD\n5sVDuS7S5ZvYCxx96dhLD4SUvN6jU2lN9QzYMPtC0NgPSBYASIyBybDGAA==\n-----END PUBLIC KEY-----\n",
		"type": "public-key",
		"counter": 0,
	}
]

export default database;