### ONNX -> TensorFlow SavedModel 변환
onnx2tf -i assets/onnx/full_081325.onnx \
  -o assets/tf_nhwc/full_081325 \
  -b 1 \
  -ois input:1,1024 \
  --output_signaturedefs

### TensorFlow SavedModel -> TF.js graphmodel로 변환
tensorflowjs_converter \
    --input_format=tf_saved_model \
    --output_format=tfjs_graph_model \
    --signature_name=serving_default \
    --saved_model_tags=serve \
    assets/tf_nhwc/full_081325 \
    assets/tf_nhwc/full_081325/saved_model

