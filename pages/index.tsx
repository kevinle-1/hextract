import React, { useRef } from 'react'
import type { NextPage } from 'next'
import Image from 'next/image'
import styles from '../styles/Home.module.scss'

import sampleImg from '../sample/firefox_9HJSePiW27.png';

import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-backend-webgl';

const Home: NextPage = () => {
  const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation; // or 'BodyPix'
  // const model = bodySegmentation.SupportedModels.BodyPix; // or 'BodyPix'

  const bodyPixConfig = {
    multiSegmentation: false,
    segmentBodyParts: true,
    refineSteps: 500
  }

  bodySegmentation.createSegmenter(model, { runtime: 'tfjs' }).then(async (segmenter) => {
    const image = document.getElementById("image") as HTMLImageElement;
    const segmentation = await segmenter.segmentPeople(image, bodyPixConfig);

    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    // Draw the image with the background blurred onto the canvas. The edge between
    // the person and blurred background is blurred by 3 pixels.
    // await bodySegmentation.drawBokehEffect(canvas, image, segmentation);

    const foregroundColor = {r: 255, g: 255, b: 255, a: 255};
    const backgroundColor = {r: 0, g: 0, b: 0, a: 255};
    const backgroundDarkeningMask = await bodySegmentation.toBinaryMask(
        segmentation, foregroundColor, backgroundColor);

    const opacity = 1;
    const maskBlurAmount = 0; // range [0,20], default: 0
    const flipHorizontal = false;

    // const canvas2 = document.getElementById('canvas2') as HTMLCanvasElement;
    // const ctx = canvas2.getContext('2d')!;
    // const { data: imgData } = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // const newImg = ctx.createImageData(image.width, image.height);
    // const newImgData = newImg.data;

    // segmentation.forEach(async (segment, i) => {
    //     const img = await segment.mask.toImageData();

    //     newImgData[i * 4] = img.data[i * 4]
    //     newImgData[i * 4 + 1] = img.data[i * 4 + 1]
    //     newImgData[i * 4 + 2] = img.data[i * 4 + 2]
    //     newImgData[i * 4 + 3] = img.data[i * 4 + 3]
    // })
    // ctx.putImageData(newImg, 0, 0);

    await bodySegmentation.drawMask(
      canvas, image, backgroundDarkeningMask, opacity, maskBlurAmount, flipHorizontal);

    const canvas2 = document.getElementById('canvas2') as HTMLCanvasElement;
    canvas2.width = image.width;
    canvas2.height = image.height;

    const ctx = canvas2.getContext('2d')!;

    const newImgData = await segmentation[0].mask.toImageData();

    ctx.putImageData(newImgData, 0, 0);
  });

  return (
    <div className={styles.container}>
      <Image id="image" src={sampleImg}></Image>
      <canvas id="canvas"></canvas>
      <canvas id="canvas2"></canvas>
    </div>
  )
}

export default Home
