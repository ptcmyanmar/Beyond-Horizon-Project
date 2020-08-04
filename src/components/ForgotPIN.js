import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {connect} from 'react-redux';
import {forgetAccounts} from '../actions';
import Separator from './Separator';
import IconSlider from './IconSlider';
import EllipticButton from './EllipticButton';

const ForgotPIN = ({forgetAccountsConnect}) => {
  return (
    <IconSlider icon={<Text style={styles.header}>Forgot PIN?</Text>}>
      <Text style={styles.h4}>Forgot PIN?</Text>
      <Separator />
      <Text>
        If you forgot your PIN, you can reset Keychain and clear your data but
        will have to enter all your keys again.
      </Text>
      <Separator height={50} />
      <EllipticButton title="Reset Keychain" onPress={forgetAccountsConnect} />
    </IconSlider>
  );
};
const styles = StyleSheet.create({
  header: {color: 'white', marginRight: 15, fontWeight: 'bold'},
  h4: {fontWeight: 'bold', fontSize: 18},
});

export default connect(null, {forgetAccountsConnect: forgetAccounts})(
  ForgotPIN,
);