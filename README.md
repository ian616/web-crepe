### ONNX -> TensorFlow SavedModel 변환
onnx2tf -i assets/onnx/model.onnx \
  -o assets/tf_nhwc \
  -b 1 \
  -ois input:1,1024 \
  --output_signaturedefs

### TensorFlow SavedModel -> TF.js graphmodel로 변환
tensorflowjs_converter \
    --input_format=tf_saved_model \
    --output_format=tfjs_graph_model \
    --signature_name=serving_default \
    --saved_model_tags=serve \
    assets/tf_nhwc \
    assets/tf_nhwc/saved_model