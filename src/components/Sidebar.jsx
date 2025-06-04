import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { OrgProjectContext } from '../context/OrgProjectContext';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function Sidebar() {
  const navigate = useNavigate();
  const {
    organizations,
    selectOrganization,
    selectProject,
    selectedOrgIndex,
    selectedProjectIndex,
    addOrganization,
    addProject,
    editOrganization,
    editProject,
    deleteOrganization,
    deleteProject,
    moveOrganization,
    moveProject
  } = useContext(OrgProjectContext);
  const [showOrgInput, setShowOrgInput] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [openOrgs, setOpenOrgs] = useState([]);
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);
  const [moveProjectInfo, setMoveProjectInfo] = useState(null);

  // 편집 모드 진입 시 모든 조직 펼침
  useEffect(() => {
    if (editMode) {
      setOpenOrgs(organizations.map((_, idx) => idx));
    }
  }, [editMode, organizations.length]);

  // 드래그 앤 드롭 핸들러
  const parseOrgIdx = (droppableId) => {
    const parts = droppableId.split('-');
    return parseInt(parts[parts.length - 1], 10);
  };
  const onDragEnd = (result) => {
    if (!result.destination) return;
    // 조직 드래그
    if (result.type === 'ORG') {
      moveOrganization(result.source.index, result.destination.index - result.source.index);
    }
    // 프로젝트 드래그
    if (result.type === 'PROJECT') {
      const sourceOrgIdx = parseOrgIdx(result.source.droppableId);
      const destOrgIdx = parseOrgIdx(result.destination.droppableId);
      if (sourceOrgIdx === destOrgIdx) {
        moveProject(sourceOrgIdx, result.source.index, result.destination.index);
      } else {
        // 조직 간 이동: 확인 UI 표시
        const project = organizations[sourceOrgIdx]?.projects[result.source.index];
        setMoveProjectInfo({
          project,
          sourceOrgIdx,
          destOrgIdx,
          sourceIndex: result.source.index
        });
        setShowMoveConfirm(true);
      }
    }
  };

  // 프로젝트 이동 확인 핸들러
  const handleMoveConfirm = () => {
    if (moveProjectInfo) {
      const { project, sourceOrgIdx, destOrgIdx, sourceIndex } = moveProjectInfo;
      deleteProject(sourceOrgIdx, sourceIndex);
      addProject(destOrgIdx, project.name);
      setShowMoveConfirm(false);
      setMoveProjectInfo(null);
    }
  };

  // 프로젝트 이동 취소 핸들러
  const handleMoveCancel = () => {
    setShowMoveConfirm(false);
    setMoveProjectInfo(null);
  };

  return (
    <aside className="bg-white rounded-2xl shadow-lg border border-gray-200 
        p-6 w-64 ml-4 flex flex-col 
        overflow-y-auto 
        h-[calc(100vh-5rem)]">
      <div className="flex items-center justify-between mb-4 ml-2">
        <h2 className="text-lg font-bold">내 프로젝트</h2>
        <button
          className={`text-xs px-2 py-1 rounded ${editMode ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setEditMode((prev) => !prev)}
        >
          {editMode ? '완료' : '편집'}
        </button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="org-list" type="ORG">
          {(provided) => (
            <ul className="space-y-4" ref={provided.innerRef} {...provided.droppableProps}>
              {organizations.map((org, orgIdx) => (
                <Draggable key={org.orgName + '-' + orgIdx} draggableId={`org-${org.orgName}-${orgIdx}`} index={orgIdx} isDragDisabled={!editMode}>
                  {(orgProvided) => (
                    <li ref={orgProvided.innerRef} {...orgProvided.draggableProps}>
                      <div className="flex items-center justify-between bg-gray-200 px-2 py-1 rounded mb-1">
                        <span
                          className={`font-semibold ${selectedOrgIndex === orgIdx ? 'text-yellow-600' : 'text-purple-600'} ${editMode ? '' : 'cursor-pointer'}`}
                          onClick={() => {
                            if (!editMode) selectOrganization(orgIdx);
                          }}
                        >
                          {org.orgName}
                        </span>
                        <div className="flex items-center gap-1">
                          {editMode && <span {...orgProvided.dragHandleProps} className="cursor-move">☰</span>}
                          {editMode && (
                            <>
                              <button className="text-xs text-gray-500" onClick={() => editOrganization(orgIdx)}>✏️</button>
                              <button className="text-xs text-red-500" onClick={() => { if (window.confirm(`"${org.orgName}" 조직을 정말 삭제하시겠습니까?`)) { deleteOrganization(orgIdx); } }}>🗑</button>
                            </>
                          )}
                        </div>
                      </div>
                      {/* 프로젝트 리스트 */}
                      {(editMode || selectedOrgIndex === orgIdx || openOrgs.includes(orgIdx)) && (
                        <Droppable droppableId={`org-${org.orgName}-${orgIdx}`} type="PROJECT">
                          {(projProvided) => (
                            <ul className="ml-4 mt-1 space-y-1 bg-white p-2 rounded" ref={projProvided.innerRef} {...projProvided.droppableProps}>
                              {org.projects.map((project, projIdx) => (
                                <Draggable key={project.name + '-' + projIdx} draggableId={`org-${orgIdx}-proj-${project.name}-${projIdx}`} index={projIdx} isDragDisabled={!editMode}>
                                  {(projDraggable) => (
                                    <li
                                      ref={projDraggable.innerRef}
                                      {...projDraggable.draggableProps}
                                      className={`flex items-center space-x-2 ${editMode ? '' : 'cursor-pointer'} ${selectedProjectIndex === projIdx && selectedOrgIndex === orgIdx ? 'text-purple-500' : 'text-gray-700'}`}
                                      onClick={() => {
                                        if (!editMode) {
                                          selectOrganization(orgIdx);
                                          selectProject(projIdx);
                                          navigate(`/main`);
                                        }
                                      }}
                                    >
                                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                                      <span>{project.name}</span>
                                      <div className="flex items-center gap-1">
                                        {editMode && <span {...projDraggable.dragHandleProps} className="cursor-move">☰</span>}
                                        {editMode && (
                                          <>
                                            <button className="text-xs text-gray-400 ml-1" onClick={e => { e.stopPropagation(); editProject(orgIdx, projIdx); }}>✏️</button>
                                            <button className="text-xs text-red-500" onClick={e => { e.stopPropagation(); if (window.confirm(`"${project.name}"을 정말 삭제하시겠습니까?`)) { deleteProject(orgIdx, projIdx); } }}>🗑</button>
                                          </>
                                        )}
                                      </div>
                                    </li>
                                  )}
                                </Draggable>
                              ))}
                              {projProvided.placeholder}
                              {editMode && (
                                <li>
                                  {showProjectInput && selectedOrgIndex === orgIdx ? (
                                    <form onSubmit={e => {
                                      e.preventDefault();
                                      if (newProjectName.trim()) {
                                        addProject(orgIdx, newProjectName);
                                      }
                                      setNewProjectName("");
                                      setShowProjectInput(false);
                                    }} className="flex flex-col gap-1">
                                      <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="border px-2 py-1 rounded text-xs" placeholder="새 프로젝트명" />
                                      <div className="flex gap-2 mt-2 justify-end">
                                        <button type="submit" className="text-xs text-blue-500">완료</button>
                                        <button type="button" className="text-xs text-gray-400" onClick={() => { setShowProjectInput(false); setNewProjectName(""); }}>취소</button>
                                      </div>
                                    </form>
                                  ) : (
                                    <button className="text-xs text-blue-500 mt-1" onClick={() => { selectOrganization(orgIdx); setShowProjectInput(true); }}>+ 프로젝트 추가</button>
                                  )}
                                </li>
                              )}
                            </ul>
                          )}
                        </Droppable>
                      )}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {editMode && (
                <li>
                  {showOrgInput ? (
                    <form onSubmit={e => {
                      e.preventDefault();
                      if (newOrgName.trim()) {
                        addOrganization(newOrgName);
                      }
                      setNewOrgName("");
                      setShowOrgInput(false);
                    }} className="flex flex-col gap-1">
                      <input value={newOrgName} onChange={e => setNewOrgName(e.target.value)} className="border px-2 py-1 rounded text-xs" placeholder="새 조직명" />
                      <div className="flex gap-2 mt-2 justify-end">
                        <button type="submit" className="text-xs text-blue-500">완료</button>
                        <button type="button" className="text-xs text-gray-400" onClick={() => { setShowOrgInput(false); setNewOrgName(""); }}>취소</button>
                      </div>
                    </form>
                  ) : (
                    <button className="text-xs text-blue-500" onClick={() => setShowOrgInput(true)}>+ 조직 추가</button>
                  )}
                </li>
              )}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      
      {/* 프로젝트 이동 확인 모달 */}
      {showMoveConfirm && moveProjectInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">프로젝트 이동</h3>
            <p className="mb-4">
              "{moveProjectInfo.project.name}" 프로젝트를 "{organizations[moveProjectInfo.destOrgIdx].orgName}" 조직으로 이동하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleMoveCancel}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                아니오
              </button>
              <button
                onClick={handleMoveConfirm}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                네
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
