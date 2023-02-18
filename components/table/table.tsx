import React, { useState, useRef, useEffect } from "react";
import {
  ConfigProvider,
  Table as AntTable,
  Button,
  Input,
  Checkbox,
} from "antd";
import type { InputRef } from "antd";
import type { ColumnType } from "antd/lib/table";
import { AiOutlineLoading } from "react-icons/ai";
import { SearchOutlined } from "@ant-design/icons";
import {
  TableRowSelection,
  FilterConfirmProps,
  FilterDropdownProps,
} from "antd/lib/table/interface";
import { GoChevronRight, GoChevronDown } from "react-icons/go";
import Highlighter from "react-highlight-words";
import { CSS } from "@dnd-kit/utilities";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Person } from "../../pages/types/Person";
import ReactDragListView from "react-drag-listview";
import { TableColumn } from "../../pages/types/TableColumn";

type DefaultRecordType = {
  [x: string]: any;
};

declare type DataIndex = string | number | (string | number)[];

interface TableProps<T> {
  columns: TableColumn<T>[];
  dataSource: T[];
  className?: string;
  loading?: boolean;
  // Selection
  selectable?: boolean;
  onSelected?: (selectedRecords: T[]) => void;
  getCheckboxProps?: (record: T) => DefaultRecordType;
  // Expand
  expandable?: boolean;
  expandedRowRender?: (record: T) => JSX.Element;
  rowExpandable?: (record: T) => boolean;
  rowClassName?: (record: T, index?: number) => string;
  pageSize?: number;
  canChangePageSize?: boolean;
  paginationPosition?: "topRight" | "topLeft" | "bottomRight" | "bottomLeft";
  setDataSource;
  setColumnsData;
}

const Table = <T extends DefaultRecordType>({
  columns,
  dataSource,
  setDataSource,
  setColumnsData,
  loading = false,
  selectable = false,
  onSelected = undefined,
  getCheckboxProps = undefined,
  expandable = false,
  expandedRowRender = undefined,
  rowExpandable = undefined,
  rowClassName = undefined,
  className = undefined,
  pageSize = 20,
  canChangePageSize = true,
  paginationPosition = "bottomRight",
}: TableProps<T>): JSX.Element => {
  const [searchText, setSearchText] = useState<string>("");
  const [searchedColumn, setSearchedColumn] = useState<string>("");
  const [itemsPerPage, setItemsPerPage] = useState<number>(pageSize);
  //const [dataSourceReceived, setDataSourceReceived] = useState<T[]>([]);

  const searchInput = useRef<InputRef>(null);

  const onRowSelection = {
    onChange: onSelected
      ? (selectedRowKeys: React.Key[], selectedRows: T[]) =>
          onSelected(selectedRows)
      : undefined,
    getCheckboxProps,
  };

  let rowSelection: TableRowSelection<T> | undefined = undefined;
  if (selectable) {
    rowSelection = { type: "checkbox" };
    if (onSelected) rowSelection = { ...onRowSelection, ...rowSelection };
  }

  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: DataIndex
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex as string);
  };

  const handleSearchReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText("");
    setSearchedColumn("");
  };

  const getColumnSearchProps = (column: TableColumn<T>): ColumnType<T> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8, minWidth: "300px" }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${column.title}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(
              selectedKeys as string[],
              confirm,
              column.dataIndex as string
            )
          }
          style={{ marginBottom: 8, display: "block" }}
        />
        <div className="grid grid-cols-3 gap-x-2 items-center">
          <Button
            className="col-span-2"
            type="primary"
            onClick={() =>
              handleSearch(
                selectedKeys as string[],
                confirm,
                column.dataIndex as string
              )
            }
            size="small"
          >
            Search
          </Button>
          <a
            className="w-full text-center"
            href="javascript:void(0);"
            onClick={() => clearFilters && handleSearchReset(clearFilters)}
          >
            Reset
          </a>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      (column.searchFormatter
        ? column.searchFormatter(record)
        : record[column.dataIndex as string].toString()
      )
        .toLowerCase()
        .includes(value.toString().toLowerCase()),
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text, record) =>
      searchedColumn === column.dataIndex ? (
        column.searchRender !== undefined &&
        column.searchHighlightProps !== undefined ? (
          React.cloneElement(column.searchRender(text, record), {
            [column.searchHighlightProps]: (
              <Highlighter
                highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                searchWords={[searchText]}
                autoEscape
                textToHighlight={
                  column.searchFormatter ? column.searchFormatter(record) : ""
                }
              />
            ),
          })
        ) : (
          <Highlighter
            highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
            searchWords={[searchText]}
            autoEscape
            textToHighlight={text ? text.toString() : ""}
          />
        )
      ) : column.searchRender !== undefined ? (
        column.searchRender(text, record)
      ) : (
        text
      ),
  });

  const renderColumn = (column: TableColumn<T>) => {
    let filters: string[] | undefined = undefined;
    if (typeof window !== "undefined" && window.location) {
      const params = new URLSearchParams(window.location.search);
      const currentParam = params.get(column.dataIndex as string);
      if (currentParam) filters = currentParam.split(",");
    }

    if (!column.defaultFilteredValue && filters)
      column.defaultFilteredValue = filters;

    if (column.searchable) {
      return { ...column, ...getColumnSearchProps(column) };
    }
    return {
      ...column,
      filterDropdown: column.filters
        ? ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            filters,
            clearFilters,
          }: FilterDropdownProps) => (
            <div className="container" style={{ minWidth: "170px" }}>
              <div className="container p-2.5 space-y-2">
                {filters &&
                  filters.map((filter, i) => (
                    <div key={i} className="container">
                      <Checkbox
                        onChange={(e) =>
                          setSelectedKeys(
                            e.target.checked
                              ? selectedKeys.concat([filter.value as React.Key])
                              : selectedKeys.filter(
                                  (key) => key !== filter.value
                                )
                          )
                        }
                        value={filter.value}
                        checked={selectedKeys.includes(
                          filter.value as React.Key
                        )}
                      >
                        {filter.text}
                      </Checkbox>
                    </div>
                  ))}
              </div>
              <hr />
              <div className="grid grid-cols-2 p-2.5 justify-items-center items-center">
                <Button size="small" type="primary" onClick={() => confirm()}>
                  OK
                </Button>
                <a
                  href="javascript:void(0);"
                  onClick={() => {
                    if (clearFilters) clearFilters();
                    setSelectedKeys([]);
                  }}
                >
                  Reset
                </a>
              </div>
            </div>
          )
        : undefined,
    };
  };

  interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    "data-row-key": string;
  }

  const Row = (props: RowProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: props["data-row-key"],
    });

    const style: React.CSSProperties = {
      ...props.style,
      transform: CSS.Transform.toString(
        transform && { ...transform, scaleY: 1 }
      ),
      transition,
      cursor: "move",
      ...(isDragging ? { position: "relative", zIndex: 9999 } : {}),
    };

    return (
      <tr
        {...props}
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      />
    );
  };

  /*   useEffect(() => {
    setDataSource(dataSource);
    setColumnsData(columns);
  }); */

  /*   const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setDataSource((prev) => {
        const activeIndex = prev.findIndex((i) => i.key === active.id);
        const overIndex = prev.findIndex((i) => i.key === over?.id);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  }; */

  const onDragEnd = (fromIndex, toIndex) => {
    const columnsCopy = columns.slice();
    const item = columnsCopy.splice(fromIndex, 1)[0];
    columnsCopy.splice(toIndex, 0, item);
    //this.setState({ columns: columnsCopy });
    setColumnsData(columnsCopy);
  };

  return (
    <ConfigProvider renderEmpty={() => <div className="mt-4">Empty</div>}>
      <ReactDragListView.DragColumn onDragEnd={onDragEnd} nodeSelector="th">
        <AntTable
          components={{
            body: {
              row: Row,
            },
          }}
          rowKey="key"
          size="middle"
          className={className}
          columns={columns?.map(renderColumn)}
          dataSource={dataSource}
          showSorterTooltip={false}
          rowSelection={rowSelection}
          loading={{
            spinning: loading,
            indicator: <AiOutlineLoading className="animate-spin" />,
          }}
          pagination={{
            size: "default",
            showSizeChanger: canChangePageSize,
            pageSize: itemsPerPage,
            onShowSizeChange: (current: number, size: number) =>
              setItemsPerPage(size),
            total: dataSource.length,
            position: [paginationPosition],
            showTotal: (total: number) =>
              total > 0 ? (
                <p>
                  {total} item{total > 1 ? "s" : ""}
                </p>
              ) : (
                <p>No item</p>
              ),
            style: {
              marginRight: "15px",
            },
          }}
          expandable={
            expandable
              ? {
                  expandedRowRender,
                  rowExpandable,
                  expandIcon: ({ expanded, onExpand, record }) =>
                    !expanded ? (
                      <span
                        className="anticon opacity-60 cursor-pointer"
                        onClick={(e) => onExpand(record, e)}
                      >
                        <GoChevronRight />
                      </span>
                    ) : (
                      <span
                        className="anticon opacity-60 cursor-pointer"
                        onClick={(e) => onExpand(record, e)}
                      >
                        <GoChevronDown />
                      </span>
                    ),
                }
              : undefined
          }
          rowClassName={rowClassName}
        />
      </ReactDragListView.DragColumn>
    </ConfigProvider>
  );
};

export { Table };
export type { TableColumn };
