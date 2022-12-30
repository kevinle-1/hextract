# Hextract

![image](https://i.imgur.com/GFoIYag.png)

A colour palette generator with subject extraction.

Powered by [Tensorflow.js real time body segmentation](https://github.com/tensorflow/tfjs-models/tree/master/body-segmentation/).

Currently a proof of concept.

## Reasoning

I have a friend who liked to apply fashion colour theory as inspiration for some of their outfits. They would take images off their Pinterest, Instagram, and other social media to load into an image to colour palette generator like Coolors. A minor problem was that it would extract the colours of the background also, and not only just the outfit.

This is a fun little project to see what can be done to solve this using a fully local solution running in the browser.

## TODO:

- Improve performance of segmentation
- Determine strategy to preload models from Google Cloud storage
  - Initial background removal run takes 5+ seconds to download and load the models
  - https://storage.googleapis.com/tfjs-models/savedmodel/bodypix/resnet50/float/group1-shard1of23.bin
  - This makes it unviable for mobile users to download as the total file size of the shards exceeds 100mb
    - Could offload compute to microservice, but bandwidth increases also
- Fix handling of remote URLs (CORS issues 😢 - will need to proxy images)
  - Intend to be able to load Instagram posts
- Pretty stuff

## Note

Colo**u**r (⌐■_■)