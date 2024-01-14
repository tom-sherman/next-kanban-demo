import "server-only";
export type { Account, Board, Column, Item } from "@prisma/client";
import { Account, Board, Item, Column, PrismaClient } from "@prisma/client";
import { experimental_taintUniqueValue as taintUniqueValue } from "react";
import invariant from "tiny-invariant";
import crypto from "node:crypto";

let prisma: PrismaClient;

declare const globalThis: {
  prisma?: PrismaClient;
};

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!globalThis.prisma) {
    globalThis.prisma = new PrismaClient();
  }
  prisma = globalThis.prisma;
}

export type AccountWithPassword = Account & {
  passwordHash: string;
  passwordSalt: string;
};

export async function getAccountWithPassword(
  email: string
): Promise<AccountWithPassword | null> {
  const result = await prisma.account.findUnique({
    where: { email: email },
    include: { Password: true },
  });

  if (!result) return null;

  invariant(result.Password, "Password should be included");

  const accountWithPassword = {
    id: result.id,
    email: result.email,
    passwordHash: result.Password.hash,
    passwordSalt: result.Password.salt,
  };

  taintUniqueValue(
    "Do not pass a user password hash to the client.",
    accountWithPassword,
    accountWithPassword.passwordHash
  );

  return accountWithPassword;
}

export async function accountExists(email: string): Promise<boolean> {
  let account = await prisma.account.findUnique({
    where: { email: email },
    select: { id: true },
  });

  return Boolean(account);
}

export async function createAccount(
  email: string,
  password: string
): Promise<Account> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha256")
    .toString("hex");

  return prisma.account.create({
    data: {
      email: email,
      Password: { create: { hash, salt } },
    },
  });
}

export async function getBoardsForUser(userId: string): Promise<Board[]> {
  return prisma.board.findMany({
    where: {
      accountId: userId,
    },
  });
}

export async function createBoard(
  userId: string,
  name: string,
  color: string
): Promise<Board> {
  return prisma.board.create({
    data: {
      name,
      color,
      Account: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export async function deleteBoard(
  boardId: number,
  accountId: string
): Promise<void> {
  await prisma.board.delete({
    where: { id: boardId, accountId },
  });
}

export type BoardWithItems = Board & {
  items: Item[];
  columns: Column[];
};

export async function getBoard(
  boardId: number,
  accountId: string
): Promise<BoardWithItems | null> {
  return prisma.board.findUnique({
    where: {
      id: boardId,
      accountId: accountId,
    },
    include: {
      items: true,
      columns: { orderBy: { order: "asc" } },
    },
  });
}

export async function updateBoardName(
  boardId: number,
  name: string,
  accountId: string
): Promise<void> {
  await prisma.board.update({
    where: { id: boardId, accountId: accountId },
    data: { name },
  });
}

export type ItemMutation = {
  id?: string;
  columnId: string;
  order: number;
  title: string;
};

export async function upsertItem(
  mutation: ItemMutation,
  accountId: string,
  boardId: number
): Promise<void> {
  await prisma.item.upsert({
    where: {
      id: mutation.id ?? crypto.randomBytes(16).toString("hex"),
      Board: {
        accountId,
      },
    },
    create: {
      ...mutation,
      boardId,
    },
    update: mutation,
  });
}

export async function createColumn(
  boardId: number,
  name: string,
  accountId: string
): Promise<void> {
  const columnCount = await prisma.column.count({
    where: { boardId, Board: { accountId } },
  });

  // TODO: Database should do this
  const id = crypto.randomBytes(16).toString("hex");

  await prisma.column.create({
    data: {
      id,
      boardId,
      name,
      order: columnCount + 1,
    },
  });
}

export async function updateColumnName(
  id: string,
  name: string,
  accountId: string
): Promise<void> {
  await prisma.column.update({
    where: { id, Board: { accountId } },
    data: { name },
  });
}
