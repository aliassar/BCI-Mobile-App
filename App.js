/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState} from 'react';
import type {Node} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native/dist/platform_react_native';

const App: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const [tfReady, setTfReady] = useState(false);
  const [data, setData] = useState();
  const [frontalAverage, setFrontalAverage] = useState(0);
  const [memory, setMemory] = useState([]);
  const last100Average = memory.reduce((a, b) => a + b, 0) / memory.length;
  if (tfReady){
    const input = tf.tensor1d(memory);
    tf.signal.stft(input, 3, 1);
    console.log(tf.signal.stft(input, 3, 1).arraySync());
  }
  const delta = frontalAverage - last100Average;

  useEffect(() => {
    const ws = new WebSocket('https://685a-185-209-196-175.eu.ngrok.io');
    ws.onopen = e => {
      console.log('connected');
    };
    ws.onmessage = e => {
      // a message was received
      const finalData = e?.data.split(', ').map(e => parseFloat(e));
      let finalFrontalAverage = finalData && [...finalData];
      if (finalFrontalAverage) {
        finalFrontalAverage.splice(4, 6);
        finalFrontalAverage =
          finalFrontalAverage.reduce((a, b) => a + b, 0) / 8;
      }
      setFrontalAverage(finalFrontalAverage);

      setData(finalData);
    };
    const tfProcess = async () => {
      // await tf.setBackend('rn-webgl');
      await tf.ready();
      // Signal to the app that tensorflow.js can now be used.
      setTfReady(true);
    };
    tfProcess();
  }, []);
  useEffect(() => {
    const finalMemory = [...memory, frontalAverage];
    while (finalMemory.length > 100) {
      finalMemory.shift();
    }
    setMemory(finalMemory);
  }, [frontalAverage]);
  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{height: '100%', margin: 24}}>
        <View>
          <Text>TensorFlow.js ready? {tfReady ? <Text>✅</Text> : ''}</Text>
        </View>
        <View>
          <Text>
            Data : {data ? data.map((e, i) => (e ? '  ' + e : '')) : null}
          </Text>
        </View>
        <View>
          <Text>Frontal Average : {frontalAverage ? frontalAverage : ''}</Text>
        </View>
        <View>
          <Text>Last 100 Average : {last100Average ? last100Average : ''}</Text>
          <Text>Memory length : {memory ? memory.length : ''}</Text>
          <Text>Delta : {delta ? delta : ''}</Text>
        </View>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            marginTop: 100,
          }}>
          <View
            style={{
              borderRadius: 100,
              width: 100,
              height: 100,
              backgroundColor: 'red',
            }}
          />
          <View
            style={{
              borderRadius:
                100 + (delta && typeof delta === 'number' ? delta / 2 : 0),
              width: 150 + (delta && typeof delta === 'number' ? delta : 0),
              height: 150 + (delta && typeof delta === 'number' ? delta : 0),
              marginTop:
                -125 - (delta && typeof delta === 'number' ? delta / 2 : 0),
              zIndex: -1,
              backgroundColor: 'pink',
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;
