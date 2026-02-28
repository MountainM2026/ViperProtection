import torch
import torch.nn as nn
import torchvision.models as models

if torch.cuda.is_available():
    DEVICE = "cuda"
elif torch.backends.mps.is_available():
    DEVICE = "mps"
else:
    DEVICE = "cpu"


class StyleFeatureExtractor(nn.Module):
    def __init__(self):
        super().__init__()
        vgg = models.vgg19(weights=models.VGG19_Weights.DEFAULT).features

        self.slice = nn.Sequential(*list(vgg.children())[:18]).eval()
        for p in self.parameters():
            p.requires_grad = False

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.slice(x)


def gram_matrix(features: torch.Tensor) -> torch.Tensor:
    b, c, h, w = features.shape
    f = features.view(b, c, -1)
    return torch.bmm(f, f.transpose(1, 2)) / (c * h * w)

    # initialize it


extractor = StyleFeatureExtractor().to(DEVICE)
