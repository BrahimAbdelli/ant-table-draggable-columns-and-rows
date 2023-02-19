import { Inter } from "@next/font/google";
import { Table } from "../components/table";
import type { TableColumn } from "../components/table";

import data from "./data.json";
import { useEffect, useState } from "react";
import { Person } from "./types/Person";
import { Order } from "./types/TableColumn";

const inter = Inter({ subsets: ["latin"] });

const columns: TableColumn<Person>[] = [
  {
    title: "Key",
    dataIndex: "key",
    width: "5%",
  },
  {
    title: "First Name",
    dataIndex: "firstName",
    width: "20%",
    sorter: (a, b) => a.firstName.localeCompare(b.firstName),
    ellipsis: true,
    searchRender: (text) => <p>{text}</p>,
    searchHighlightProps: "children",
    searchable: true,
    searchFormatter: (record) => record.firstName,
  },
  {
    title: "Last Name",
    dataIndex: "lastName",
    width: "25%",
    sorter: (a, b) => a.lastName.localeCompare(b.lastName),
    ellipsis: true,
    searchRender: (text, record) => <p>{text}</p>,
    searchHighlightProps: "children",
    searchable: true,
    searchFormatter: (record) => record.firstName,
  },
  {
    title: "Email",
    dataIndex: "email",
    width: "25%",
    sorter: (a, b) => a.email.localeCompare(b.email),
    ellipsis: true,
    searchRender: (text, record) => <p>{text}</p>,
    searchHighlightProps: "children",
    searchable: true,
    searchFormatter: (record) => record.email,
  },
  {
    title: "Gender",
    dataIndex: "gender",
    width: "10%",
    sorter: (a, b) => a.gender.localeCompare(b.gender),
    ellipsis: true,
  },
  {
    title: "IP Address",
    dataIndex: "ipAddress",
    width: "15%",
    sorter: (a, b) => a.ipAddress.localeCompare(b.ipAddress),
    ellipsis: true,
  },
];

export default function Home() {
  const [dataSource, setDataSource] = useState<Person[]>([]);
  const [columnsData, setColumnsData] = useState<TableColumn<Person>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setDataSource(data);
    setColumnsData(columns);

    if (localStorage.getItem("order")) {
      const order: Order[] = JSON.parse(localStorage.getItem("order") || "[]");
      const reorderedList: any = order.map((item) =>
        columns.find((x) => x.dataIndex == item.element)
      );
      setColumnsData(reorderedList);
    }
    setIsLoading(false);
  }, []);

  return (
    <div
      style={{
        margin: "20px auto",
        width: "100%",
        maxWidth: "1400px",
        border: "1px solid #cfcfcf",
        borderRadius: "4px",
      }}
    >
      {!isLoading ? (
        <Table
          columns={columnsData}
          setColumnsData={setColumnsData}
          dataSource={dataSource}
          setDataSource={setDataSource}
          loading={isLoading}
        />
      ) : (
        <div>Loading</div>
      )}
    </div>
  );
}
