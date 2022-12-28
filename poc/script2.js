const segementImage = async () => {
    console.log("begin segment")
    const img = document.getElementById('image');

    const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
    const segmenterConfig = {
    runtime: 'tfjs', // or 'tfjs'
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
    modelType: 'general'
    }
    const segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);

    const segmentation = await segmenter.segmentPeople(img);

    const foregroundThreshold = 0.5;
    const backgroundBlurAmount = 3;
    const edgeBlurAmount = 3;
    const flipHorizontal = false;

    const canvas = document.getElementById('canvas');

    console.log("segemented");

    await bodySegmentation.drawBokehEffect(
        canvas, img, segmentation, foregroundThreshold, backgroundBlurAmount,
        edgeBlurAmount, flipHorizontal);
}

segementImage();