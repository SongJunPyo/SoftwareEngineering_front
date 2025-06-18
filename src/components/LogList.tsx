import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface Log {
  log_id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  project_id: number;
  timestamp: string;
}

const LogList: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get('/api/v1/logs/');
        setLogs(response.data);
      } catch (error) {
        console.error('로그를 불러오는데 실패했습니다:', error);
      }
    };

    fetchLogs();
  }, []);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>사용자 ID</TableCell>
            <TableCell>액션</TableCell>
            <TableCell>상세 내용</TableCell>
            <TableCell>생성 시간</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.log_id}>
              <TableCell>{log.log_id}</TableCell>
              <TableCell>{log.user_id}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>
                {log.entity_type} / {log.entity_id} / {log.project_id}
              </TableCell>
              <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LogList; 