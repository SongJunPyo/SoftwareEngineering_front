// import React, { useContext, useState, useEffect } from 'react';
// import axios from 'axios';
// import { OrgProjectContext } from '../context/OrgProjectContext';
// import { useNavigate } from 'react-router-dom';
// import { Link } from 'react-router-dom';
// import TaskDetailPage from './TaskDetailPage';
// import Modal from '../components/Task_Modal';


// function AllTasksPage() {
//   // 1) Context 훅 (항상 최상단)
//   const { organizations, selectedOrgIndex, selectedProjectIndex } =
//     useContext(OrgProjectContext);
//   const navigate = useNavigate();

//   // 2) State 훅들 (항상 같은 순서로 호출)
//   const [tasks, setTasks]         = useState([]);
//   const [members, setMembers]     = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [openTaskId, setOpenTaskId] = useState(null);
//   const [form, setForm]           = useState({
//     title: '',
//     startDate: new Date().toISOString().slice(0, 10),
//     dueDate: new Date().toISOString().slice(0, 10),
//     assignee: '',
//     parentTask: '',
//     priority: 'medium',
//   });

//   // 3) currentOrg / currentProject 계산
//   const currentOrg = organizations?.[selectedOrgIndex];
//   const currentProject = currentOrg?.projects?.[selectedProjectIndex];
//   // projectId를 컴포넌트 최상단에서 정의해 두면,
//   // useEffect나 handleSubmit 안에서도 자유롭게 쓸 수 있습니다.
//   const projectId = currentProject?.project_id ?? null;

//   // 4) 프로젝트가 바뀔 때마다 Tasks, Members를 불러오기
//   useEffect(() => {
//     if (!currentProject) return;   // projectId가 null이면 아무것도 하지 않음

//     const projectId = currentProject.projectId;  
//     const token = localStorage.getItem('access_token');
//     if (!token) {
//       alert('로그인 후 이용하세요.');
//       navigate('/login');
//       return;
//     }

//     // 4-1) 작업 목록 호출
//     axios
//       .get(`http://localhost:8005/api/v1/tasks?project_id=${projectId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       .then((res) => {
//         setTasks(res.data);
//       })
//       .catch((err) => {
//         console.error('작업 목록 로드 실패:', err);
//         if (err.response?.status === 401) {
//           localStorage.removeItem('access_token');
//           navigate('/login');
//         }
//       });

//     // 4-2) 프로젝트 멤버 목록 호출
//     axios
//       .get(`http://localhost:8005/api/v1/project_members?project_id=${projectId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       .then((res) => {
//         setMembers(res.data);
//       })
//       .catch((err) => {
//         console.error('프로젝트 멤버 목록 로드 실패:', err);
//         if (err.response?.status === 401) {
//           localStorage.removeItem('access_token');
//           navigate('/login');
//         }
//       });
//   }, [projectId, navigate]); 
//   // ESLint 경고를 없애려면, useEffect 의존성에 projectId와 navigate를 넣어야 합니다.

//   // 5) 조기 리턴: 아직 프로젝트가 선택되지 않았거나 로딩 중이면
//   if (!currentOrg || !currentProject) {
//     return <div>프로젝트를 선택하거나, 로딩 중입니다…</div>;
//   }

//   // 6) 모달 열기/닫기 핸들러
//   const handleOpenModal = () => setShowModal(true);
//   const handleCloseModal = () => setShowModal(false);

//   // 7) 폼 입력 변화 핸들러
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm(prev => ({ ...prev, [name]: value }));
//   };

//   // 8) 폼 제출 (업무 생성)
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // 숫자로 변환하거나 null 처리
//     const assigneeId   = form.assignee ? Number(form.assignee) : null;
//     const parentTaskId = form.parentTask ? Number(form.parentTask) : null;

//     const payload = {
//       title: form.title,
//       start_date: form.startDate.length === 10 ? form.startDate + 'T00:00:00' : form.startDate,
//       due_date: form.dueDate.length === 10 ? form.dueDate + 'T00:00:00' : form.dueDate,
//       assignee_id: assigneeId,
//       parent_task_id: parentTaskId,
//       priority: form.priority,
//       project_id: currentProject.projectId,  // <-- 여기서도 projectId를 사용
//     };

//     // 간단 유효성 검사
//     if (!payload.title || !payload.start_date || !payload.due_date) {
//       alert('업무명, 시작일, 마감일은 필수 입력 항목입니다.');
//       return;
//     }

//     try {
//       const token = localStorage.getItem('access_token');
//       const res = await axios.post(
//         'http://localhost:8005/api/v1/tasks',
//         payload,
//         {
//           headers: { Authorization: `Bearer ${token}` }
//         }
//       );

//       // 생성된 업무 객체를 받아와서 리스트에 추가
//       setTasks(prev => [...prev, res.data]);
//       handleCloseModal();

//       // 폼 초기화
//       setForm({
//         title: '',
//         startDate: new Date().toISOString().slice(0, 10),
//         dueDate: new Date().toISOString().slice(0, 10),
//         assignee: '',
//         parentTask: '',
//         priority: 'medium',
//       });
//     } catch (err) {
//       console.error('업무 생성 실패:', err);
//       alert(err.response?.data?.detail || '업무 생성 중 오류가 발생했습니다.');
//       if (err.response?.status === 401) {
//         localStorage.removeItem('access_token');
//         navigate('/login');
//       }
//     }
//   };

//   const Modal = ({ children, onClose }) => (
//     <div
//       className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-6 relative"
//         onClick={e => e.stopPropagation()}
//       >
//         <button
//           onClick={onClose}
//           className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
//         >
//           ✕
//         </button>
//         {children}
//       </div>
//     </div>
//   );

//   return (
//     <div className="p-4">
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-semibold">All Tasks</h1>
//         <button
//           onClick={handleOpenModal}
//           className="bg-blue-500 text-white px-4 py-2 rounded"
//         >
//           + 업무 추가
//         </button>
//       </div>

//       {/* 모달 창 */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//           <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
//             <h2 className="text-xl mb-4">업무 추가</h2>
//             <form onSubmit={handleSubmit}>
//               {/* 업무명 */}
//               <div className="mb-2">
//                 <label className="block">
//                   업무명<span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   name="title"           // 반드시 "title"로 맞추기
//                   value={form.title}
//                   onChange={handleChange}
//                   required
//                   className="border w-full p-2 rounded"
//                 />
//               </div>

//               {/* 시작일 */}
//               <div className="mb-2">
//                 <label>시작일</label>
//                 <input
//                   type="date"
//                   name="startDate"
//                   value={form.startDate}
//                   onChange={handleChange}
//                   className="border w-full p-2 rounded"
//                 />
//               </div>

//               {/* 마감일 */}
//               <div className="mb-2">
//                 <label>마감일</label>
//                 <input
//                   type="date"
//                   name="dueDate"
//                   value={form.dueDate}
//                   onChange={handleChange}
//                   className="border w-full p-2 rounded"
//                 />
//               </div>

//               {/* 담당자 선택 */}
//               <div className="mb-2">
//                 <label>담당자</label>
//                 <select
//                   name="assignee"
//                   value={form.assignee}
//                   onChange={handleChange}
//                   className="border w-full p-2 rounded"
//                 >
//                   <option value="">없음</option>
//                   {members.map(member => (
//                     <option
//                       key={member.user_id}        // 고유 key prop
//                       value={member.user_id}      // 실제 user_id를 value로 사용
//                     >
//                       {member.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* 상위 업무 선택 */}
//               <div className="mb-2">
//                 <label>상위 업무</label>
//                 <select
//                   name="parentTask"
//                   value={form.parentTask}
//                   onChange={handleChange}
//                   className="border w-full p-2 rounded"
//                 >
//                   <option value="">없음</option>
//                   {tasks.map(task => (
//                     <option
//                       key={task.task_id}          // 고유 key prop
//                       value={task.task_id}
//                     >
//                       {task.title}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* 우선순위 */}
//               <div className="mb-4">
//                 <label>우선순위</label>
//                 <select
//                   name="priority"
//                   value={form.priority}
//                   onChange={handleChange}
//                   className="border w-full p-2 rounded"
//                 >
//                   <option value="low">low</option>
//                   <option value="medium">medium</option>
//                   <option value="high">high</option>
//                 </select>
//               </div>

//               {/* 취소/저장 버튼 */}
//               <div className="flex justify-end">
//                 <button
//                   type="button"
//                   onClick={handleCloseModal}
//                   className="mr-2 px-4 py-2"
//                 >
//                   취소
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-blue-500 text-white px-4 py-2 rounded"
//                 >
//                   저장
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {openTaskId && (
//         <Modal onClose={handleCloseModal}> 
//           <TaskDetailPage taskId={openTaskId} inner />
//         </Modal>
//       )}

//       {/* 업무 리스트 */}
//       <ul>
//         {/* {tasks.map(task => (
//           <li key={task.task_id} className="border-b py-2 hover:bg-gray-50">
//             <Link to={`/tasks/${task.task_id}`} className="block">
//               <strong className="text-blue-600">{task.title}</strong> &nbsp;
//               {task.assignee_name ? (
//                 <span className="text-gray-500">(담당자: {task.assignee_name})</span>
//               ) : (
//                 <span className="text-gray-500">(담당자: 없음)</span>
//               )}
//               <br />
//               <small className="text-gray-400">
//                 우선순위: {task.priority} | 시작: {task.start_date.slice(0, 10)} | 마감:{' '}
//                 {task.due_date.slice(0, 10)}
//               </small>
//             </Link>
//           </li>
//         ))} */}
        
//         {tasks.map(task => (
//           <li key={task.task_id} className="border-b py-2 hover:bg-gray-50">
//             <button
//               className="block text-left w-full"
//               onClick={() => setOpenTaskId(task.task_id)}
//             >
//               <strong className="text-blue-600">{task.title}</strong>&nbsp;
//               {task.assignee_name
//                 ? <span className="text-gray-500">(담당자: {task.assignee_name})</span>
//                 : <span className="text-gray-500">(담당자: 없음)</span>
//               }
//               <br/>
//               <small className="text-gray-400">
//                 우선순위: {task.priority} | 시작: {task.start_date.slice(0,10)} | 마감: {task.due_date.slice(0,10)}
//               </small>
//             </button>
//           </li>
//         ))}
//       </ul>

//       {/* 모달 */}
//       {openTaskId && (
//         <Modal onClose={() => setOpenTaskId(null)}>
//           {/* inner prop으로 기존 레이아웃 충돌 최소화 */}
//           <TaskDetailPage taskId={openTaskId} inner />
//         </Modal>
//       )}
//     </div>
//   );
// }

// export default AllTasksPage;

import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { OrgProjectContext } from '../context/OrgProjectContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import TaskDetailPage from './TaskDetailPage';
import Modal from '../components/Task_Modal';


function AllTasksPage() {
  // 1) Context 훅 (항상 최상단)
  const { organizations, selectedOrgIndex, selectedProjectIndex } =
    useContext(OrgProjectContext);
  const navigate = useNavigate();

  // 2) State 훅들 (항상 같은 순서로 호출)
  const [tasks, setTasks]         = useState([]);
  const [members, setMembers]     = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [form, setForm]           = useState({
    title: '',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    assignee: '',
    parentTask: '',
    priority: 'medium',
  });

  // 3) currentOrg / currentProject 계산
  const currentOrg = organizations?.[selectedOrgIndex];
  const currentProject = currentOrg?.projects?.[selectedProjectIndex];
  // projectId를 컴포넌트 최상단에서 정의해 두면,
  // useEffect나 handleSubmit 안에서도 자유롭게 쓸 수 있습니다.
  const projectId = currentProject?.project_id ?? null;

  // 4) 프로젝트가 바뀔 때마다 Tasks, Members를 불러오기
  useEffect(() => {
    if (!currentProject) return;   // projectId가 null이면 아무것도 하지 않음

    const projectId = currentProject.projectId;  
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인 후 이용하세요.');
      navigate('/login');
      return;
    }

    // 4-1) 작업 목록 호출
    axios
      .get(`http://localhost:8005/api/v1/tasks?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setTasks(res.data);
      })
      .catch((err) => {
        console.error('작업 목록 로드 실패:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      });

    // 4-2) 프로젝트 멤버 목록 호출
    axios
      .get(`http://localhost:8005/api/v1/project_members?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMembers(res.data);
      })
      .catch((err) => {
        console.error('프로젝트 멤버 목록 로드 실패:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      });
  }, [projectId, navigate]); 
  // ESLint 경고를 없애려면, useEffect 의존성에 projectId와 navigate를 넣어야 합니다.

  // 5) 조기 리턴: 아직 프로젝트가 선택되지 않았거나 로딩 중이면
  if (!currentOrg || !currentProject) {
    return <div>프로젝트를 선택하거나, 로딩 중입니다…</div>;
  }

  // 6) 모달 열기/닫기 핸들러
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  // 7) 폼 입력 변화 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 8) 폼 제출 (업무 생성)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 숫자로 변환하거나 null 처리
    const assigneeId = form.assignee ? Number(form.assignee) : null;
    if (!assigneeId) {
      alert('담당자를 선택하세요.');
      return;
    }
    const parentTaskId = form.parentTask ? Number(form.parentTask) : null;

    const payload = {
      title: form.title,
      start_date: form.startDate.length === 10 ? form.startDate + 'T00:00:00' : form.startDate,
      due_date: form.dueDate.length === 10 ? form.dueDate + 'T00:00:00' : form.dueDate,
      assignee_id: assigneeId,
      parent_task_id: parentTaskId,
      priority: form.priority,
      project_id: currentProject.projectId,  // <-- 여기서도 projectId를 사용
    };

    // 간단 유효성 검사
    if (!payload.title || !payload.start_date || !payload.due_date) {
      alert('업무명, 시작일, 마감일은 필수 입력 항목입니다.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        'http://localhost:8005/api/v1/tasks',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // 생성된 업무 객체를 받아와서 리스트에 추가
      setTasks(prev => [...prev, res.data]);
      handleCloseModal();

      // 폼 초기화
      setForm({
        title: '',
        startDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date().toISOString().slice(0, 10),
        assignee: '',
        parentTask: '',
        priority: 'medium',
      });
    } catch (err) {
      console.error('업무 생성 실패:', err);
      alert(err.response?.data?.detail || '업무 생성 중 오류가 발생했습니다.');
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      }
    }
  };

  const Modal = ({ children, onClose }) => (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">All Tasks</h1>
        <button
          onClick={handleOpenModal}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          + 업무 추가
        </button>
      </div>

      {/* 모달 창 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl mb-4">업무 추가</h2>
            <form onSubmit={handleSubmit}>
              {/* 업무명 */}
              <div className="mb-2">
                <label className="block">
                  업무명<span className="text-red-500">*</span>
                </label>
                <input
                  name="title"           // 반드시 "title"로 맞추기
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="border w-full p-2 rounded"
                />
              </div>

              {/* 시작일 */}
              <div className="mb-2">
                <label>시작일</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="border w-full p-2 rounded"
                />
              </div>

              {/* 마감일 */}
              <div className="mb-2">
                <label>마감일</label>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  className="border w-full p-2 rounded"
                />
              </div>

              {/* 담당자 선택 */}
              <div className="mb-2">
                <label>담당자</label>
                <select
                  name="assignee"
                  value={form.assignee}
                  onChange={handleChange}
                  className="border w-full p-2 rounded"
                >
                  <option value="">담당자 선택</option>
                  {members.map(member => (
                    <option
                      key={member.user_id}        // 고유 key prop
                      value={member.user_id}      // 실제 user_id를 value로 사용
                    >
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 상위 업무 선택 */}
              <div className="mb-2">
                <label>상위 업무</label>
                <select
                  name="parentTask"
                  value={form.parentTask}
                  onChange={handleChange}
                  className="border w-full p-2 rounded"
                >
                  <option value="">없음</option>
                  {tasks.map(task => (
                    <option
                      key={task.task_id}          // 고유 key prop
                      value={task.task_id}
                    >
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 우선순위 */}
              <div className="mb-4">
                <label>우선순위</label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="border w-full p-2 rounded"
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </div>

              {/* 취소/저장 버튼 */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="mr-2 px-4 py-2"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openTaskId && (
        <Modal onClose={handleCloseModal}> 
          <TaskDetailPage taskId={openTaskId} inner />
        </Modal>
      )}

      {/* 업무 리스트 */}
      <ul>
        {/* {tasks.map(task => (
          <li key={task.task_id} className="border-b py-2 hover:bg-gray-50">
            <Link to={`/tasks/${task.task_id}`} className="block">
              <strong className="text-blue-600">{task.title}</strong> &nbsp;
              {task.assignee_name ? (
                <span className="text-gray-500">(담당자: {task.assignee_name})</span>
              ) : (
                <span className="text-gray-500">(담당자: 없음)</span>
              )}
              <br />
              <small className="text-gray-400">
                우선순위: {task.priority} | 시작: {task.start_date.slice(0, 10)} | 마감:{' '}
                {task.due_date.slice(0, 10)}
              </small>
            </Link>
          </li>
        ))} */}
        
        {tasks.map(task => (
          <li key={task.task_id} className="border-b py-2 hover:bg-gray-50">
            <button
              className="block text-left w-full"
              onClick={() => setOpenTaskId(task.task_id)}
            >
              <strong className="text-blue-600">{task.title}</strong>&nbsp;
              {task.assignee_name
                ? <span className="text-gray-500">(담당자: {task.assignee_name})</span>
                : <span className="text-gray-500">(담당자: 없음)</span>
              }
              <br/>
              <small className="text-gray-400">
                우선순위: {task.priority} | 시작: {task.start_date.slice(0,10)} | 마감: {task.due_date.slice(0,10)}
              </small>
            </button>
          </li>
        ))}
      </ul>

      {/* 모달 */}
      {openTaskId && (
        <Modal onClose={() => setOpenTaskId(null)}>
          {/* inner prop으로 기존 레이아웃 충돌 최소화 */}
          <TaskDetailPage taskId={openTaskId} inner />
        </Modal>
      )}
    </div>
  );
}

export default AllTasksPage;
