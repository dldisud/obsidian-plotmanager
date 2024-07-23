# PlotManager

## 한국어

PlotManager는 작가들이 여러 작품의 플롯과 캐릭터를 효과적으로 관리할 수 있도록 도와주는 Obsidian 플러그인입니다.

### 주요 기능

1. **작품 관리**
   - 각 작품을 독립적인 폴더로 관리합니다.
   - 예: "대하소설", "단편집", "SF 시리즈" 등의 작품 폴더를 만들 수 있습니다.

2. **플롯 포인트 생성**
   - 각 작품 내에서 플롯 포인트를 쉽게 생성하고 관리할 수 있습니다.
   - 예시 플롯 포인트: "주인공의 첫 모험", "반전 사건", "클라이맥스" 등

3. **캐릭터 생성**
   - 작품별로 캐릭터를 생성하고 관리할 수 있습니다.
   - 캐릭터 정보 예: 이름, 역할, 배경, 성격 등

4. **태그 필터링**
   - 태그를 사용하여 플롯 포인트와 캐릭터를 필터링할 수 있습니다.
   - 예: "#중요", "#미해결", "#주인공" 등의 태그로 필터링

5. **상태 표시**
   - 플롯 포인트의 현재 상태를 시각적으로 표시합니다.
   - 상태 예: "계획 중", "초고 작성", "수정 중", "완료"

6. **시각화**
   - 작품, 플롯 포인트, 캐릭터 간의 관계를 그래프로 시각화합니다.
   - 예: 주인공과 관련된 플롯 포인트들을 한눈에 볼 수 있습니다.

7. **커스터마이즈 가능한 설정**
   - 폴더 구조와 플러그인 동작을 사용자의 필요에 맞게 조정할 수 있습니다.

### 상세 사용 방법

1. **새 작품 생성**
   - 리본 메뉴의 PlotMaster 아이콘을 클릭하거나 명령 팔레트에서 "Create new work" 명령을 사용합니다.
   - 예: "미스터리 소설" 이라는 이름으로 새 작품을 생성합니다.

2. **플롯 포인트 추가**
   - 작품을 선택한 후 "Create plot point" 명령을 사용합니다.
   - 예시:
     ```markdown
     ---
     title: 살인 사건 발생
     scene: 호텔 로비
     status: 초고 작성
     ---

     탐정 주인공이 호텔 로비에서 첫 번째 살인 사건을 목격합니다.
     ```

3. **캐릭터 추가**
   - 작품을 선택한 후 "Create character" 명령을 사용합니다.
   - 예시:
     ```markdown
     ---
     name: 김형사
     role: 주인공
     background: 20년 경력의 베테랑 형사
     personality: 고집이 세지만 정의감이 강함
     ---

     김형사는 이번 연쇄 살인 사건의 수사를 맡게 된 주인공입니다.
     ```

4. **작품 구조 보기**
   - PlotMaster 뷰에서 작품을 선택하여 플롯 포인트와 캐릭터 목록을 확인합니다.
   - 예: "미스터리 소설" 작품을 클릭하면 모든 플롯 포인트와 캐릭터가 표시됩니다.

5. **태그 사용**
   - 플롯 포인트나 캐릭터에 태그를 추가하고 필터링합니다.
   - 예: "#용의자" 태그를 사용해 모든 용의자 캐릭터를 쉽게 찾을 수 있습니다.

6. **시각화 활용**
   - 설정에서 시각화 기능을 활성화하고 작품의 구조를 그래프로 확인합니다.
   - 예: 주요 사건들과 연관된 캐릭터들의 관계를 한눈에 파악할 수 있습니다.

### 설정 조정

설정 탭에서 다음과 같은 옵션을 조정할 수 있습니다:
- Works 폴더 경로 (기본값: 'Works')
- Plot points 폴더 이름 (기본값: 'PlotPoints')
- Characters 폴더 이름 (기본값: 'Characters')
- 태그 필터
- 상태 표시 활성화/비활성화
- 시각화 기능 활성화/비활성화

## English

PlotManager is an Obsidian plugin designed to help writers effectively manage plots and characters across multiple works.

### Key Features

1. **Work Management**
   - Manage each work in its own independent folder.
   - Example: Create work folders like "Epic Novel", "Short Story Collection", "SF Series", etc.

2. **Plot Point Creation**
   - Easily create and manage plot points within each work.
   - Example plot points: "Hero's First Adventure", "Plot Twist", "Climax", etc.

3. **Character Creation**
   - Create and manage characters for each work.
   - Character info examples: name, role, background, personality, etc.

4. **Tag Filtering**
   - Use tags to filter plot points and characters.
   - Example: Filter using tags like "#important", "#unresolved", "#protagonist", etc.

5. **Status Display**
   - Visually display the current status of plot points.
   - Status examples: "Planning", "First Draft", "Revising", "Completed"

6. **Visualization**
   - Visualize the relationships between works, plot points, and characters in a graph.
   - Example: See all plot points related to the protagonist at a glance.

7. **Customizable Settings**
   - Adjust folder structures and plugin behavior to fit your needs.

### Detailed Usage

1. **Create a New Work**
   - Click the PlotMaster icon in the ribbon menu or use the "Create new work" command in the command palette.
   - Example: Create a new work named "Mystery Novel".

2. **Add Plot Points**
   - Select a work and use the "Create plot point" command.
   - Example:
     ```markdown
     ---
     title: Murder Discovery
     scene: Hotel Lobby
     status: First Draft
     ---

     The detective protagonist witnesses the first murder in the hotel lobby.
     ```

3. **Add Characters**
   - Select a work and use the "Create character" command.
   - Example:
     ```markdown
     ---
     name: Detective Smith
     role: Protagonist
     background: 20 years of experience as a detective
     personality: Stubborn but with a strong sense of justice
     ---

     Detective Smith is the protagonist tasked with solving this serial murder case.
     ```

4. **View Work Structure**
   - Select a work in the PlotMaster view to see the list of plot points and characters.
   - Example: Click on "Mystery Novel" to see all its plot points and characters.

5. **Using Tags**
   - Add tags to plot points or characters and use them for filtering.
   - Example: Use the "#suspect" tag to easily find all suspect characters.

6. **Utilizing Visualization**
   - Enable the visualization feature in settings and check the structure of your work in a graph.
   - Example: Quickly understand the relationships between major events and related characters.

### Adjusting Settings

In the settings tab, you can adjust the following options:
- Works folder path (default: 'Works')
- Plot points folder name (default: 'PlotPoints')
- Characters folder name (default: 'Characters')
- Tag filter
- Enable/disable status display
- Enable/disable visualization feature
