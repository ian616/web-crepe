import os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

import torch
from models.components.crepe_net import CREPENet  # 사용자 모델

import tvm
from tvm import relax
from tvm.relax.frontend.torch import from_fx

TARGET = "webgpu"
OUT_DIR = "assets/wasm"
os.makedirs(OUT_DIR, exist_ok=True)

model = CREPENet.load_crepe_model("assets/trained_model", model_capacity="tiny")
model.eval()

# FX 추적으로 Torch 모델을 TVM IRModule로 변환
fx_model = torch.fx.symbolic_trace(model)
input_info = [((1, 1024), "float32")]  # (shape, dtype)
with torch.no_grad():
    mod = from_fx(fx_model, input_info)

# 기본 최적화 파이프라인 적용
mod = relax.get_pipeline()(mod)

# 모듈과 params를 따로 확보
mod, params = relax.frontend.detach_params(mod)

# 빌드
with tvm.transform.PassContext(opt_level=3):
    ex = relax.build(mod, target=TARGET, params=params)

# 네이티브 라이브러리 및 params 저장
ex.export_library(f"{OUT_DIR}/model.wasm")

param_bytes = tvm.runtime.save_param_dict(params)
with open(f"{OUT_DIR}/params.bin", "wb") as f:
    f.write(param_bytes)

print(f"✅ Build complete. Files in {OUT_DIR}")