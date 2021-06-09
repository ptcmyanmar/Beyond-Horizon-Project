import Toast from 'react-native-simple-toast';

import {SIGN_UP, LOCK, UNLOCK, INIT_ACCOUNTS} from './types';
import {decryptToJson} from 'utils/encrypt';
import {navigate} from 'utils/navigation';
import {translate} from 'utils/localize';
import {getFromKeychain} from 'utils/keychainStorage';
import {AppThunk} from 'src/hooks/redux';
import {
  accountsPayload,
  actionPayload,
  auth,
  nullableString,
} from './interfaces';

export const signUp = (pwd: string) => {
  navigate('AddAccountByKeyScreen');
  const action: actionPayload<nullableString> = {type: SIGN_UP, payload: pwd};
  return action;
};

export const unlock = (
  mk: string,
  errorCallback: (b?: boolean) => void,
): AppThunk => async (dispatch, getState) => {
  try {
    const accountsEncrypted = await getFromKeychain('accounts');
    const accounts = decryptToJson(accountsEncrypted, mk);
    if (accounts && accounts.list) {
      const unlock: actionPayload<nullableString> = {type: UNLOCK, payload: mk};
      dispatch(unlock);
      const init: actionPayload<accountsPayload> = {
        type: INIT_ACCOUNTS,
        payload: {accounts: accounts.list},
      };
      dispatch(init);
    }
    if (getState().browser.shouldFocus) {
      navigate('BrowserScreen');
    }
  } catch (e) {
    if (e.message === 'Wrapped error: User not authenticated') {
      errorCallback(true);
    } else {
      Toast.show(`${translate('toast.authFailed')}: ${e.message}`, Toast.LONG);
      console.log(e.message);
      errorCallback();
    }
  }
};

export const lock = () => {
  const action: actionPayload<any> = {type: LOCK};
  return action;
};

export * from 'actions/accounts';
export * from 'actions/hive';
export * from 'actions/hiveEngine';
export * from 'actions/settings';
export * from 'actions/browser';
