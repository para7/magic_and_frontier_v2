#!/usr/bin/env python3
"""Minimal RCON client for Minecraft server command execution."""

from __future__ import annotations

import argparse
import socket
import struct
import sys


def encode_packet(request_id: int, packet_type: int, body: str) -> bytes:
    payload = struct.pack("<ii", request_id, packet_type) + body.encode("utf-8") + b"\x00\x00"
    return struct.pack("<i", len(payload)) + payload


def recv_exact(sock: socket.socket, size: int) -> bytes:
    chunks = []
    received = 0
    while received < size:
        chunk = sock.recv(size - received)
        if not chunk:
            raise RuntimeError("RCON connection closed unexpectedly")
        chunks.append(chunk)
        received += len(chunk)
    return b"".join(chunks)


def decode_packet(sock: socket.socket) -> tuple[int, int, str]:
    header = recv_exact(sock, 4)
    (length,) = struct.unpack("<i", header)
    payload = recv_exact(sock, length)
    request_id, packet_type = struct.unpack("<ii", payload[:8])
    body = payload[8:-2].decode("utf-8", errors="replace")
    return request_id, packet_type, body


def run_command(host: str, port: int, password: str, command: str, timeout: float) -> str:
    with socket.create_connection((host, port), timeout=timeout) as sock:
        sock.sendall(encode_packet(1, 3, password))
        request_id, _, _ = decode_packet(sock)
        if request_id == -1:
            raise RuntimeError("RCON authentication failed")

        sock.sendall(encode_packet(2, 2, command))
        _, _, response = decode_packet(sock)
        return response


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a Minecraft command over RCON.")
    parser.add_argument("--host", required=True, help="Minecraft container IP or hostname")
    parser.add_argument("--port", type=int, default=25575, help="RCON port")
    parser.add_argument("--password", required=True, help="RCON password")
    parser.add_argument("--command", required=True, help="Command string to execute")
    parser.add_argument("--timeout", type=float, default=5.0, help="Socket timeout in seconds")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        response = run_command(
            host=args.host,
            port=args.port,
            password=args.password,
            command=args.command,
            timeout=args.timeout,
        )
    except Exception as exc:
        print(f"RCON error: {exc}", file=sys.stderr)
        return 1

    print(response)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
