import * as Keychain from 'react-native-keychain';
import Toast from 'react-native-simple-toast';

import {
  SIGN_UP,
  ADD_ACCOUNT,
  FORGET_ACCOUNTS,
  LOCK,
  UNLOCK,
  INIT_ACCOUNTS,
  ACTIVE_ACCOUNT,
  GLOBAL_PROPS,
  ACTIVE_ACCOUNT_RC,
} from './types';
import {encryptJson, decryptToJson} from 'utils/encrypt';
import {navigate} from '../navigationRef';
import {translate} from 'utils/localize';
import {client} from 'utils/dhive';
import {chunkArray} from 'utils/format';

export const signUp = (pwd) => {
  navigate('AddAccountByKeyScreen');
  return {type: SIGN_UP, payload: pwd};
};

export const addAccount = (name, keys, wallet) => async (
  dispatch,
  getState,
) => {
  const mk = getState().auth.mk;
  const previousAccounts = getState().accounts;
  if (previousAccounts.find((e) => e.name === name)) {
    Toast.show(translate('toast.account_already'));
    if (wallet) {
      navigate('WalletScreen');
    }

    return;
  }
  dispatch({type: ADD_ACCOUNT, payload: {name, keys}});
  const accounts = [...previousAccounts, {name, keys}];
  const encrypted = encryptJson({list: accounts}, mk);
  const chunks = chunkArray(encrypted.split(''), 300).map((e) => e.join(''));
  for (const [i, chunk] of chunks.entries()) {
    await Keychain.setGenericPassword(`accounts_${chunks.length}`, chunk, {
      accessControl:
        i === 0
          ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE
          : null,
      service: `accounts_${i}`,
      storage: Keychain.STORAGE_TYPE.RSA,
    });
  }
  if (wallet) {
    navigate('WalletScreen');
  }
};

export const unlock = (mk, errorCallback) => async (dispatch, getState) => {
  try {
    let accountsEncrypted = '';
    let i = 0;
    let length = 10;
    while (i < length) {
      const cred = await Keychain.getGenericPassword({
        service: `accounts_${i}`,
        authenticationPrompt: {title: 'Authenticate'},
      });
      if (i === 0) {
        length = cred.username.replace('accounts_', '');
      }
      accountsEncrypted += cred.password;
      i++;
    }
    const accounts = decryptToJson(accountsEncrypted, mk);
    if (accounts && accounts.list) {
      dispatch({type: UNLOCK, payload: mk});
      dispatch({type: INIT_ACCOUNTS, payload: accounts.list});
    }
    console.log(INIT_ACCOUNTS);
  } catch (e) {
    console.log(e, e.message);
    if (e.message === 'Wrapped error: User not authenticated') {
      errorCallback(true);
    } else {
      Toast.show(translate('toast.authFailed'));
      errorCallback();
    }
  }
};

export const lock = () => {
  return {type: LOCK};
};

export const forgetAccounts = () => (dispatch) => {
  dispatch({
    type: FORGET_ACCOUNTS,
  });
};

export const loadAccount = (username) => async (dispatch, getState) => {
  dispatch(getAccountRC(username));
  const account = (await client.database.getAccounts([username]))[0];
  const keys = getState().accounts.find((e) => e.name === username).keys;
  dispatch({
    type: ACTIVE_ACCOUNT,
    payload: {
      account,
      keys,
    },
  });
};

const getAccountRC = (username) => async (dispatch) => {
  const rc = await client.rc.getRCMana(username);
  dispatch({
    type: ACTIVE_ACCOUNT_RC,
    payload: rc,
  });
};

export const loadProperties = () => async (dispatch) => {
  const [globals, price, rewardFund] = await Promise.all([
    client.database.getDynamicGlobalProperties(),
    client.database.getCurrentMedianHistoryPrice(),
    client.database.call('get_reward_fund', ['post']),
  ]);
  const props = {globals, price, rewardFund};
  console.log('a', props);
  dispatch({type: GLOBAL_PROPS, payload: props});
};
