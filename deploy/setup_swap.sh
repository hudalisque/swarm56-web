#!/bin/bash

# 4GB 가상 메모리(Swap) 설정 스크립트
# 보리스 처니 디자인 패턴에 의거하여 여러 번 실행해도 안전한 멱등성(Idempotency)을 보장합니다.

SWAP_PATH="/swapfile"
SWAP_SIZE_GB=4

echo "=== 가상 메모리(Swap) 스왑 설정 및 최적화 시작 ==="

# 1. 멱등성 검사: 이미 스왑 파일이 등록되어 활성화 중인지 확인
if swapon --show | grep -q "$SWAP_PATH"; then
    echo "[안내] 이미 $SWAP_PATH 경로로 스왑 메모리가 활성화되어 있습니다. 추가 설정을 건너뜁니다."
    free -h
    exit 0
fi

# 2. 멱등성 검사: 스왑 파일이 파일시스템에 이미 존재하지만 활성화되지 않은 경우 처리
if [ -f "$SWAP_PATH" ]; then
    echo "[안내] $SWAP_PATH 파일이 이미 존재합니다. 안전하게 비활성화 후 재생성합니다."
    sudo swapoff "$SWAP_PATH" 2>/dev/null
    sudo rm -f "$SWAP_PATH"
fi

# 3. 4GB 크기의 빈 파일 생성 (1024 * 4 = 4194304)
echo "[진행] 4GB 크기의 스왑 파일을 생성하고 있습니다 ($SWAP_PATH)..."
sudo dd if=/dev/zero of="$SWAP_PATH" bs=1M count=$((SWAP_SIZE_GB * 1024)) status=progress

if [ $? -ne 0 ]; then
    echo "[에러] 스왑 파일 생성에 실패했습니다." >&2
    exit 1
fi

# 4. 파일 권한 설정 (소유자 읽기/쓰기만 허용 - 보안)
echo "[진행] 스왑 파일의 보안 권한을 600으로 설정합니다..."
sudo chmod 600 "$SWAP_PATH"

# 5. 스왑 영역 포맷팅
echo "[진행] 스왑 영역을 빌드합니다 (mkswap)..."
sudo mkswap "$SWAP_PATH"

# 6. 스왑 활성화
echo "[진행] 스왑을 시스템에 활성화합니다 (swapon)..."
sudo swapon "$SWAP_PATH"

# 7. 재부팅 시에도 영구 적용되도록 /etc/fstab에 추가 (멱등성 적용)
echo "[진행] /etc/fstab 설정 검사 및 영구 등록..."
if grep -q "$SWAP_PATH" /etc/fstab; then
    echo "[안내] 이미 /etc/fstab에 스왑 항목이 등록되어 있습니다."
else
    echo "$SWAP_PATH swap swap defaults 0 0" | sudo tee -a /etc/fstab >/dev/null
    echo "[완료] /etc/fstab에 스왑 항목을 영구 등록했습니다."
fi

# 8. Swappiness 설정 튜닝 (10으로 설정하여 물리 RAM을 최대한 활용하도록 권장)
echo "[진행] Swappiness 최적화 설정 (vm.swappiness=10)..."
sudo sysctl vm.swappiness=10

# 재부팅 시에도 적용되도록 /etc/sysctl.conf에 영구 추가 (멱등성 적용)
if grep -q "vm.swappiness" /etc/sysctl.conf; then
    # 기존 설정이 있으면 10으로 교체
    sudo sed -i 's/^vm.swappiness.*/vm.swappiness=10/' /etc/sysctl.conf
else
    echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf >/dev/null
fi

echo "=== 가상 메모리(Swap) 설정 완료 ==="
free -h
