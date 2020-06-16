import hive, {client} from './dhive';

const isMemoWif = (publicKey, memo) => {
  return publicKey === memo;
};

const getPubkeyWeight = (publicKey, permissions) => {
  for (let n in permissions.key_auths) {
    const keyWeight = permissions.key_auths[n];
    const lpub = keyWeight['0'];
    if (publicKey === lpub) {
      return keyWeight['1'];
    }
  }
  return 0;
};

const validatePrivateKey = (account, pwd, publicKey) => {
  if (isMemoWif(publicKey, account.memo_key)) {
    return {memo: pwd, memoPubkey: publicKey};
  } else if (getPubkeyWeight(publicKey, account.posting)) {
    return {posting: pwd, postingPubkey: publicKey};
  } else if (getPubkeyWeight(publicKey, account.active)) {
    return {active: pwd, activePubkey: publicKey};
  } else {
    return null;
  }
};

const derivateFromMasterPassword = (username, account, pwd) => {
  const posting = hive.PrivateKey.fromLogin(username, pwd, 'posting');
  const active = hive.PrivateKey.fromLogin(username, pwd, 'active');
  const memo = hive.PrivateKey.fromLogin(username, pwd, 'memo');
  const keys = {
    posting: posting.toString(),
    active: active.toString(),
    memo: memo.toString(),
    postingPubkey: posting.createPublic().toString(),
    activePubkey: active.createPublic().toString(),
    memoPubkey: memo.createPublic().toString(),
  };
  console.log(keys);
  const has_active = getPubkeyWeight(keys.activePubkey, account.active);
  const has_posting = getPubkeyWeight(keys.postingPubkey, account.posting);

  if (has_active || has_posting || keys.memoPubkey === account.memo_key) {
    const workingKeys = {};
    if (has_active) {
      workingKeys.active = keys.active;
      workingKeys.activePubkey = keys.activePubkey;
    }
    if (has_posting) {
      workingKeys.posting = keys.posting;
      workingKeys.postingPubkey = keys.postingPubkey;
    }
    if (keys.memoPubkey === account.memo_key) {
      workingKeys.memo = keys.memo;
      workingKeys.memoPubkey = keys.memoPubkey;
    }
    return workingKeys;
  } else {
    return null;
  }
};

const getPublicKeyFromPrivateKeyString = (pwd) => {
  try {
    const privateKey = hive.PrivateKey.fromString(pwd);
    const publicKey = privateKey.createPublic();
    return publicKey.toString();
  } catch (e) {
    return null;
  }
};

export default async (username, pwd) => {
  const account = (await client.database.getAccounts([username]))[0];
  const publicKey = getPublicKeyFromPrivateKeyString(pwd);
  if (publicKey) {
    return validatePrivateKey(account, pwd, publicKey);
  }
  return derivateFromMasterPassword(username, account, pwd);
};