IMAGE_SRC = 'sample/firefox_xW0AQZNEnT.png'

const loadImage = () => {
  const img = new Image()

  img.crossorigin='anonymous';
  img.src = IMAGE_SRC

  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d')

  img.addEventListener('load', () => {
    canvas.height = img.height;
    canvas.width = img.width;

    // Resizing logic affects background removal quality :(
    // canvas.height = canvas.width * (img.height / img.width);\

    // var oc = document.createElement('canvas'),
    // octx = oc.getContext('2d');
    // oc.width = img.width * 0.5;
    // oc.height = img.height * 0.5;
    // octx.drawImage(img, 0, 0, oc.width, oc.height);

    // octx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5);
    // ctx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5, 0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, 0)
    backgroundRemoval()
  })
}

const backgroundRemoval = async () => {
  var startTime = performance.now()

  const canvas = document.querySelector('canvas')

  const net = await bodyPix.load({
    architecture: 'ResNet50',
    outputStride: 32,
    quantBytes: 4
  })
  const segmentation = await net.segmentPerson(canvas, {
    internalResolution: 'medium',
    segmentationThreshold: 0.7,
    scoreTreshold: 0.7
  })

  const ctx = canvas.getContext('2d')

  console.log("RGB");

  const newImg = ctx.createImageData(canvas.width, canvas.height)
  const newImgData = newImg.data

  console.log(segmentation);

  segmentation.data.forEach((segment, i) => {
    if (segment == 1) {
      newImgData[i * 4] = imgData[i * 4]
      newImgData[i * 4 + 1] = imgData[i * 4 + 1]
      newImgData[i * 4 + 2] = imgData[i * 4 + 2]
      newImgData[i * 4 + 3] = imgData[i * 4 + 3]
    }
  })

  console.log("New image");
  newImg.crossOrigin = "anonymous";
  ctx.putImageData(newImg, 0, 0)

  let dataArray = newImg.data
  let rgbArray = []
  for (var i = 0; i < dataArray.length; i+=4) {
      if (dataArray[i] != 0 && dataArray[i+1] != 0 && dataArray[i+2] != 0)
      {
        rgbArray.push([dataArray[i], dataArray[i+1], dataArray[i+2]])
      }
  }

  console.log(rgbArray);
  var endTime = performance.now()
  console.log(`${endTime - startTime} milliseconds`)

}

loadImage()
