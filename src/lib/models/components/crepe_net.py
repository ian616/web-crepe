import torch
from torch import nn
from torch.serialization import add_safe_globals

class CREPENet(nn.Module):

    def load_crepe_model(weight_path, model_capacity="tiny"):
        model = CREPENet(model_capacity=model_capacity)
        state_dict = torch.load(weight_path + "/last.pth", map_location="cpu", weights_only=False)
        model.load_state_dict(state_dict)
        model.eval()
        return model

    def __init__(self, model_capacity="tiny"):
        super().__init__()
        capacity_multiplier = {
            "tiny": 4, "small": 8, "medium": 16, "large": 24, "full": 32
        }[model_capacity]

        filters = [n * capacity_multiplier for n in [32, 4, 4, 4, 8, 16]]
        widths = [512, 64, 64, 64, 64, 64]
        strides = [(4, 1), (1, 1), (1, 1), (1, 1), (1, 1), (1, 1)]

        layers = []
        in_channels = 1
        for i, (f, w, s) in enumerate(zip(filters, widths, strides), 1):
            layers.append(nn.Conv2d(in_channels, f, kernel_size=(w, 1), stride=s, padding=(w//2, 0)))
            layers.append(nn.BatchNorm2d(f))
            layers.append(nn.ReLU())
            layers.append(nn.MaxPool2d(kernel_size=(2, 1)))
            layers.append(nn.Dropout(0.25))
            in_channels = f

        self.conv_blocks = nn.Sequential(*layers)
        self.fc = nn.Linear(filters[-1] * 4, 360)  # Flatten 후 360 차원
        # CREPE는 sigmoid를 사용해 360 bins에 대해 multi-label classification 수행
        self.activation = nn.Sigmoid()

    def forward(self, x):
        # x: (batch, 1024)
        x = x.unsqueeze(1).unsqueeze(-1)  # -> (batch, 1, 1024, 1)
        x = self.conv_blocks(x)

        x = x.permute(0, 3, 1, 2) # Transpose to (batch, W, C, H)
        x = torch.flatten(x, start_dim=1)

        x = self.fc(x)
        return self.activation(x)


if __name__ == "__main__":
    _ = CREPENet()
