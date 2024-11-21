let currentList = null;
let lists = {};
let sortOption = 'name';
let sortOrder = 'asc';
let searchKeyword = '';

// 현재 수정할 재고 아이템의 인덱스 저장
let editingItemIndex = null;

// 초기화 함수
function initializeApp() {
    // 로컬 스토리지에서 데이터 로드
    loadDataFromLocalStorage();

    // 탭 전환 기능 구현
    document.getElementById('tabA').addEventListener('click', function() {
        showTab('A');
    });
    document.getElementById('tabB').addEventListener('click', function() {
        if (!currentList || !lists[currentList]) {
            alert('선택된 목록이 없습니다. 먼저 목록을 선택하세요.');
            showTab('A');
        } else {
            showTab('B');
            renderInventory();
        }
    });
    document.getElementById('tabC').addEventListener('click', function() {
        if (!currentList || !lists[currentList]) {
            alert('선택된 목록이 없습니다. 먼저 목록을 선택하세요.');
            showTab('A');
        } else {
            showTab('C');
            updateOrderList();
        }
    });

    // A탭 기능 구현
    document.getElementById('addListButton').addEventListener('click', function() {
        const listName = document.getElementById('listNameInput').value.trim();
        if (!listName) {
            alert('목록 이름을 입력하세요.');
            return;
        }

        if (lists[listName]) {
            alert('이미 동일한 이름의 목록이 있습니다.');
            return;
        }

        lists[listName] = []; // 빈 아이템 배열로 초기화
        renderList();
        document.getElementById('listNameInput').value = '';
        saveDataToLocalStorage(); // 데이터 저장
    });

    function renderList() {
        const listContainer = document.getElementById('listContainer');
        listContainer.innerHTML = '';

        Object.keys(lists).forEach(function(listName) {
            const li = document.createElement('li');
            li.classList.add('list-item');

            const listNameSpan = document.createElement('span');
            listNameSpan.textContent = listName;
            listNameSpan.classList.add('list-name'); // 목록 이름에 클래스 추가

            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');

            const editButton = document.createElement('button');
            editButton.textContent = '수정';
            editButton.addEventListener('click', function(event) {
                event.stopPropagation(); // 목록 전체 버튼 클릭 방지
                const newListName = prompt('새로운 목록 이름을 입력하세요.', listName);
                if (newListName && newListName.trim() !== '') {
                    if (lists[newListName]) {
                        alert('이미 동일한 이름의 목록이 있습니다.');
                        return;
                    }
                    lists[newListName] = lists[listName];
                    delete lists[listName];
                    if (currentList === listName) {
                        currentList = newListName;
                    }
                    renderList();
                    saveDataToLocalStorage(); // 데이터 저장
                }
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '삭제';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', function(event) {
                event.stopPropagation(); // 목록 전체 버튼 클릭 방지
                if (confirm('해당 목록을 삭제하시겠습니까?')) {
                    delete lists[listName];
                    if (currentList === listName) {
                        currentList = null;
                    }
                    renderList();
                    saveDataToLocalStorage(); // 데이터 저장
                }
            });

            buttonContainer.appendChild(editButton);
            buttonContainer.appendChild(deleteButton);

            li.appendChild(listNameSpan);
            li.appendChild(buttonContainer);

            li.addEventListener('click', function() {
                currentList = listName;
                document.getElementById('inventoryTitle').textContent = `재고 관리 - ${currentList}`;
                showTab('B');
                renderInventory();
            });

            listContainer.appendChild(li);
        });
    }

    // 데이터 저장 및 불러오기 기능 구현
    document.getElementById('saveDataButton').addEventListener('click', function() {
        const dataStr = JSON.stringify(lists, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('데이터가 저장되었습니다.');
    });

    document.getElementById('loadDataButton').addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });

    // 파일 입력 요소에 이벤트 리스너 추가
    document.getElementById('fileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    lists = JSON.parse(e.target.result);
                    renderList();
                    alert('데이터가 불러와졌습니다.');
                } catch (error) {
                    alert('유효한 JSON 파일이 아닙니다.');
                }
            };
            reader.readAsText(file);
        }
    });

    // 로컬 스토리지에 데이터 저장
    function saveDataToLocalStorage() {
        const dataStr = JSON.stringify(lists);
        localStorage.setItem('inventoryData', dataStr);
    }

    // 로컬 스토리지에서 데이터 불러오기
    function loadDataFromLocalStorage() {
        const dataStr = localStorage.getItem('inventoryData');
        if (dataStr) {
            try {
                lists = JSON.parse(dataStr);
                renderList();
            } catch (error) {
                alert('로컬 스토리지에 저장된 데이터가 손상되었습니다.');
                lists = {};
                saveDataToLocalStorage();
            }
        }
    }

    // B탭 기능 구현
    document.getElementById('addItemButton').addEventListener('click', function() {
        const itemName = document.getElementById('itemNameInput').value.trim();
        const maxQuantityInput = document.getElementById('maxQuantityInput').value;
        const currentStockInput = document.getElementById('currentStockInput').value;
        const otherInfo = document.getElementById('otherInfoInput').value.trim();

        // 데이터 유효성 검사
        if (!itemName) {
            alert('재고 이름을 입력하세요.');
            return;
        }

        const maxQuantity = maxQuantityInput !== '' ? parseInt(maxQuantityInput) : null;
        const currentStock = currentStockInput !== '' ? parseInt(currentStockInput) : null;

        if (maxQuantity !== null && (isNaN(maxQuantity) || maxQuantity < 0)) {
            alert('유효한 최대 수량을 입력하세요.');
            return;
        }

        if (currentStock !== null && (isNaN(currentStock) || currentStock < 0)) {
            alert('유효한 현재 재고를 입력하세요.');
            return;
        }

        const inventory = lists[currentList];

        // 아이템 이름 중복 확인
        if (inventory.some(item => item.name === itemName)) {
            alert('이미 동일한 이름의 재고 아이템이 있습니다.');
            return;
        }

        inventory.push({
            name: itemName,
            maxQuantity: maxQuantity,
            currentStock: currentStock,
            otherInfo: otherInfo
        });

        renderInventory();

        // 입력 필드 초기화
        document.getElementById('itemNameInput').value = '';
        document.getElementById('maxQuantityInput').value = '';
        document.getElementById('currentStockInput').value = '';
        document.getElementById('otherInfoInput').value = '';

        saveDataToLocalStorage(); // 데이터 저장
    });

    function renderInventory() {
        const inventoryContainer = document.getElementById('inventoryContainer').getElementsByTagName('tbody')[0];
        inventoryContainer.innerHTML = '';

        if (!currentList || !lists[currentList]) {
            inventoryContainer.innerHTML = '<tr><td colspan="5">선택된 목록이 없습니다. 먼저 목록을 선택하세요.</td></tr>';
            return;
        }

        const inventory = lists[currentList];

        // 검색 기능 적용
        let filteredInventory = inventory.filter(item => {
            return item.name.toLowerCase().includes(searchKeyword.toLowerCase());
        });

        // 정렬 기능 적용
        filteredInventory.sort((a, b) => {
            let valA = a[sortOption];
            let valB = b[sortOption];

            if (valA === null || valA === undefined) valA = '';
            if (valB === null || valB === undefined) valB = '';

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        if (filteredInventory.length === 0) {
            inventoryContainer.innerHTML = '<tr><td colspan="5">재고 항목이 없습니다.</td></tr>';
            return;
        }

        filteredInventory.forEach(function(item, index) {
            const tr = document.createElement('tr');

            // 이름
            const tdName = document.createElement('td');
            tdName.textContent = item.name;
            tr.appendChild(tdName);

            // 최대 수량
            const tdMax = document.createElement('td');
            tdMax.textContent = item.maxQuantity !== null ? item.maxQuantity : '';
            tr.appendChild(tdMax);

            // 현재 재고
            const tdCurrent = document.createElement('td');
            tdCurrent.textContent = item.currentStock !== null ? item.currentStock : '';
            tr.appendChild(tdCurrent);

            // 기타 정보
            const tdOther = document.createElement('td');
            tdOther.textContent = item.otherInfo;
            tr.appendChild(tdOther);

            // 작업 (재고수정, 기타수정, 삭제)
            const tdActions = document.createElement('td');
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');

            const editCurrentStockButton = document.createElement('button');
            editCurrentStockButton.textContent = '재고수정';
            editCurrentStockButton.addEventListener('click', function() {
                editingItemIndex = inventory.indexOf(item);
                openModal(item.currentStock);
            });

            const editOtherInfoButton = document.createElement('button');
            editOtherInfoButton.textContent = '기타수정';
            editOtherInfoButton.addEventListener('click', function() {
                const newOtherInfo = prompt('새로운 기타 정보를 입력하세요.', item.otherInfo);
                if (newOtherInfo === null) return; // 취소 시
                item.otherInfo = newOtherInfo.trim();
                renderInventory();
                saveDataToLocalStorage(); // 데이터 저장
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '삭제';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', function() {
                // 정확한 항목을 삭제하기 위해 고유 식별자 사용
                const originalIndex = inventory.findIndex(i => i.name === item.name);
                if (originalIndex !== -1) {
                    if (confirm('해당 재고 아이템을 삭제하시겠습니까?')) {
                        inventory.splice(originalIndex, 1);
                        renderInventory();
                        saveDataToLocalStorage(); // 데이터 저장
                    }
                } else {
                    alert('삭제할 수 없는 항목입니다.');
                }
            });

            // 버튼을 버튼 컨테이너에 추가
            buttonContainer.appendChild(editCurrentStockButton);
            buttonContainer.appendChild(editOtherInfoButton);
            buttonContainer.appendChild(deleteButton);

            tdActions.appendChild(buttonContainer);
            tr.appendChild(tdActions);

            inventoryContainer.appendChild(tr);
        });
    }

    // 검색 기능 이벤트 리스너
    document.getElementById('searchInput').addEventListener('input', function() {
        searchKeyword = this.value.trim();
        renderInventory();
    });

    // 정렬 기능 이벤트 리스너
    document.getElementById('sortSelect').addEventListener('change', function() {
        sortOption = this.value;
        renderInventory();
    });

    document.getElementById('sortAscButton').addEventListener('click', function() {
        sortOrder = 'asc';
        renderInventory();
    });

    document.getElementById('sortDescButton').addEventListener('click', function() {
        sortOrder = 'desc';
        renderInventory();
    });

    // 현재 재고 및 기타 정보 초기화
    document.getElementById('resetStockButton').addEventListener('click', function() {
        if (confirm('모든 재고의 현재 재고와 기타 정보를 초기화하시겠습니까?')) {
            const inventory = lists[currentList];
            inventory.forEach(function(item) {
                item.currentStock = null; // 현재 재고를 null로 설정
                item.otherInfo = ''; // 기타 정보를 빈 문자열로 설정
            });
            renderInventory();
            saveDataToLocalStorage(); // 데이터 저장
        }
    });

    // 탭 이동 버튼
    document.getElementById('backToListButton').addEventListener('click', function() {
        currentList = null;
        showTab('A');
    });

    document.getElementById('goToCTabButton').addEventListener('click', function() {
        if (!currentList || !lists[currentList]) {
            alert('선택된 목록이 없습니다. 먼저 목록을 선택하세요.');
            showTab('A');
        } else {
            showTab('C');
            updateOrderList();
        }
    });

    document.getElementById('backToBTabButton').addEventListener('click', function() {
        showTab('B');
    });

    // C탭 기능 구현
    function updateOrderList() {
        const orderListContainer = document.getElementById('orderListContainer').getElementsByTagName('tbody')[0];
        orderListContainer.innerHTML = '';

        if (!currentList || !lists[currentList]) {
            orderListContainer.innerHTML = '<tr><td colspan="3">선택된 목록이 없습니다. 먼저 목록을 선택하세요.</td></tr>';
            return;
        }

        const inventory = lists[currentList];

        let hasOrders = false;

        inventory.forEach(function(item) {
            const maxQuantity = item.maxQuantity;
            const currentStock = item.currentStock;
            const otherInfo = item.otherInfo;

            let needOrder = false;
            let orderQuantity = 0;

            if (maxQuantity !== null && currentStock !== null) {
                if (currentStock < maxQuantity) {
                    needOrder = true;
                    orderQuantity = maxQuantity - currentStock;
                }
            }

            // 'needOrder'가 true이거나 'otherInfo'가 있는 경우에만 표시
            if (needOrder || otherInfo) {
                hasOrders = true;
                const tr = document.createElement('tr');

                // 재고 이름
                const tdName = document.createElement('td');
                tdName.textContent = item.name;
                tr.appendChild(tdName);

                // 발주 수량
                const tdOrder = document.createElement('td');
                tdOrder.innerHTML = needOrder ? `<strong>${orderQuantity}</strong>` : '';
                tr.appendChild(tdOrder);

                // 기타 정보
                const tdOther = document.createElement('td');
                tdOther.innerHTML = otherInfo ? `<strong>${otherInfo}</strong>` : '';
                tr.appendChild(tdOther);

                orderListContainer.appendChild(tr);
            }
        });

        if (!hasOrders) {
            orderListContainer.innerHTML = '<tr><td colspan="3">발주할 항목이 없습니다.</td></tr>';
        }
    }

    // 모달 관련 변수
    const modal = document.getElementById('editStockModal');
    const closeButton = document.querySelector('.close-button');
    const saveStockButton = document.getElementById('saveStockButton');
    const modalInput = document.getElementById('modalCurrentStockInput');

    // 모달 열기 함수
    function openModal(currentStock) {
        modalInput.value = currentStock !== null ? currentStock : '';
        modal.style.display = 'block';
        modalInput.focus();
    }

    // 모달 닫기 함수
    function closeModal() {
        modal.style.display = 'none';
        editingItemIndex = null;
    }

    // 모달 닫기 이벤트
    closeButton.addEventListener('click', closeModal);

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            closeModal();
        }
    });

    // 모달 저장 버튼 이벤트
    saveStockButton.addEventListener('click', function() {
        const newCurrentStockInput = modalInput.value.trim();
        const newCurrentStock = newCurrentStockInput === '' ? null : parseInt(newCurrentStockInput);

        if (newCurrentStockInput !== '' && (isNaN(newCurrentStock) || newCurrentStock < 0)) {
            alert('유효한 현재 재고를 입력하세요.');
            return;
        }

        if (editingItemIndex !== null && lists[currentList][editingItemIndex]) {
            lists[currentList][editingItemIndex].currentStock = newCurrentStock;
            renderInventory();
            saveDataToLocalStorage(); // 데이터 저장
        }

        closeModal();
    });

    // "찾기" 버튼 토글 기능 구현
    document.getElementById('toggleFindButton').addEventListener('click', function() {
        const findOptions = document.querySelector('.find-options');
        if (findOptions.classList.contains('hidden')) {
            findOptions.classList.remove('hidden');
            this.textContent = '숨기기'; // 버튼 텍스트 변경
        } else {
            findOptions.classList.add('hidden');
            this.textContent = '찾기'; // 버튼 텍스트 변경
        }
    });

    // "재고 등록" 버튼 토글 기능 구현
    document.getElementById('toggleRegisterButton').addEventListener('click', function() {
        const registerOptions = document.querySelector('.register-options');
        if (registerOptions.classList.contains('hidden')) {
            registerOptions.classList.remove('hidden');
            this.textContent = '숨기기'; // 버튼 텍스트 변경
        } else {
            registerOptions.classList.add('hidden');
            this.textContent = '재고 등록'; // 버튼 텍스트 변경
        }
    });

    // 페이지 초기 로드 시 A탭 표시
    showTab('A');
    renderList();
}

// 탭 전환 함수
function showTab(tabName) {
    const contents = document.querySelectorAll('.content');
    contents.forEach(function(content) {
        content.classList.remove('active');
    });

    const tabs = document.querySelectorAll('.tabs button');
    tabs.forEach(function(tab) {
        tab.classList.remove('active');
    });

    document.getElementById('content' + tabName).classList.add('active');
    document.getElementById('tab' + tabName).classList.add('active');
}

// 초기화 함수 호출
document.addEventListener('DOMContentLoaded', initializeApp);
