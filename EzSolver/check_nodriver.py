import nodriver as uc
import inspect

print(f"nodriver version: {uc.__version__ if hasattr(uc, '__version__') else 'unknown'}")
sig = inspect.signature(uc.start)
for name, param in sig.parameters.items():
    print(f"Param: {name}, Default: {param.default}")
