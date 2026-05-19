import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppStackParamList } from '../../navigation/AppDrawer'
import Header from '../../components/Header'

type Props =NativeStackScreenProps<AppStackParamList,'FoodMenu'>
const FoodMenu:React.FC<Props> = () => {
  return (
    <View>
    <Header title='Food Menu'/>
    </View>
  )
}

export default FoodMenu

const styles = StyleSheet.create({})