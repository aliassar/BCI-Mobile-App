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
  TextInput,
  Button,
} from 'react-native';
import Fili from 'fili';

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native/dist/platform_react_native';

const App: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const [tfReady, setTfReady] = useState(false);
  const [data, setData] = useState();
  const [url, onChangeUrl] = React.useState('');
  const [frontalAverage, setFrontalAverage] = useState(0);
  const [memory, setMemory] = useState([]);
  const [ratio, setRatio] = useState([]);
  useEffect(() => {
    if (memory.length > 1) {
      const iirCalculator = new Fili.CalcCascades();
      const availableFilters = iirCalculator.available();
      const iirFilterCoeffsAlpha = iirCalculator.bandpass({
        order: 1, // cascade 3 biquad filters (max: 12)
        characteristic: 'butterworth',
        Fs: 128, // sampling frequency
        Fc: 5.5, // cutoff frequency / center frequency for bandpass, bandstop, peak,
        BW: 3, // bandwidth only for bandstop and bandpass filters - optional
        gain: 0, // gain for peak, lowshelf and highshelf
        preGain: false, // adds one constant multiplication for highpass and lowpass
        // k = (1 + cos(omega)) * 0.5 / k = 1 with preGain == false
      });
      const iirFilterCoeffsTheta = iirCalculator.bandpass({
        order: 1, // cascade 3 biquad filters (max: 12)
        characteristic: 'butterworth',
        Fs: 128, // sampling frequency
        Fc: 10.5, // cutoff frequency / center frequency for bandpass, bandstop, peak,
        BW: 5, // bandwidth only for bandstop and bandpass filters - optional
        gain: 0, // gain for peak, lowshelf and highshelf
        preGain: false, // adds one constant multiplication for highpass and lowpass
        // k = (1 + cos(omega)) * 0.5 / k = 1 with preGain == false
      });
      const filterAplha = new Fili.IirFilter(iirFilterCoeffsAlpha);
      const filterTheta = new Fili.IirFilter(iirFilterCoeffsTheta);
      const alpha = filterAplha.simulate(memory);
      const theta = filterTheta.simulate(memory);
      const finalRatio = alpha.map((e, i) => e / theta[i]);
      setRatio(finalRatio);
    }
  }, [memory]);
  const last100Average = ratio.reduce((a, b) => a + b, 0) / memory.length;
  const lastRatio = ratio.length > 0 ? ratio[ratio.length - 1] : 0;
  const delta = lastRatio - last100Average;
  const urlSubmit = () => {
    let newUrl = url.replace(' ', '');
    const expressionWithHtml =
      /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
    const expressionWithoutHtml =
      /^[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    const expressionWithHtmlRegex = new RegExp(expressionWithHtml);
    const expressionWithoutHtmlRegex = new RegExp(expressionWithoutHtml);
    if (!newUrl.match(expressionWithHtmlRegex)) {
      if (!newUrl.match(expressionWithoutHtmlRegex)) {
        console.log('Bad Url');
        alert('Bad Url');
        return;
      } else {
        newUrl = 'http://' + newUrl;
      }
    }
    try {
      const ws = new WebSocket(newUrl);
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
    } catch (e) {
      console.log('Bad Url');
      alert('Bad Url');
      console.log(e);
    }
  };
  // useEffect(() => {
  //
  //   // const tfProcess = async () => {
  //   //   // await tf.setBackend('rn-webgl');
  //   //   await tf.ready();
  //   //   // Signal to the app that tensorflow.js can now be used.
  //   //   setTfReady(true);
  //   // };
  //   // tfProcess();
  // }, []);
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
          <TextInput
            onChangeText={onChangeUrl}
            value={url}
            style={{
              height: 40,
              margin: 12,
              borderWidth: 1,
              padding: 10,
              borderColor: '#000',
            }}
          />
        </View>
        <View>
          <Button title="Connect" onPress={urlSubmit} />
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
