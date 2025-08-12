import os
import torch

# 모델 클래스 임포트
from src.models.components.crepe_net import CREPENet

def ckpt_to_pth(ckpt_path: str, pth_path: str, model_capacity: str = "tiny"):
    # Lightning CKPT 로드 (전체 객체 로드, unsafe 허용)
    ckpt = torch.load(ckpt_path, map_location="cpu", weights_only=False)

    # state_dict 꺼내오기 (Lightning에서 저장하는 형식)
    state_dict = ckpt["state_dict"]

    # Lightning이 저장할 때 'model.' prefix가 붙는 경우가 있으니 제거
    new_state_dict = {}
    for k, v in state_dict.items():
        if k.startswith("model."):
            new_key = k.replace("model.", "", 1)
        elif k.startswith("net."):
            new_key = k.replace("net.", "", 1)
        else:
            new_key = k
        new_state_dict[new_key] = v

    # 모델 초기화
    model = CREPENet(model_capacity=model_capacity)
    model.load_state_dict(new_state_dict)

    # 순수 PyTorch state_dict 저장
    torch.save(model.state_dict(), pth_path)
    print(f"[OK] Saved .pth file to: {pth_path}")

if __name__ == "__main__":
    ckpt_path = "assets/trained_model/last.ckpt"
    pth_path = "assets/trained_model/last.pth"

    ckpt_to_pth(ckpt_path, pth_path, model_capacity="tiny")