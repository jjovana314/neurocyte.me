FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# generated/ is gitignored (build artifact from proto/calculator.proto) -
# regenerate it here the same way scripts/generate-proto.js does locally,
# including the relative-import fix protoc doesn't apply on its own.
COPY proto ./proto
COPY generated/__init__.py ./generated/__init__.py
RUN python -m grpc_tools.protoc \
    -I proto --python_out=generated --grpc_python_out=generated \
    proto/calculator.proto \
  && sed -i \
    's/import calculator_pb2 as calculator__pb2/from . import calculator_pb2 as calculator__pb2/' \
    generated/calculator_pb2_grpc.py

COPY app.py edss_calculator.py ncs_calculator.py ./

EXPOSE 50051
CMD ["python", "app.py"]
