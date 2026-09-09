"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-03-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trading_enabled', sa.Boolean(), default=False),
        sa.Column('risk_per_trade_pct', sa.Float(), default=1.0),
        sa.Column('max_position_size_usd', sa.Float(), default=10.0),
        sa.Column('max_open_positions', sa.Integer(), default=3),
        sa.Column('daily_loss_limit_usd', sa.Float(), default=5.0),
        sa.Column('weekly_loss_limit_usd', sa.Float(), default=15.0),
        sa.Column('max_drawdown_pct', sa.Float(), default=10.0),
        sa.Column('min_liquidity_usd', sa.Float(), default=5000.0),
        sa.Column('max_slippage_pct', sa.Float(), default=2.0),
        sa.Column('max_price_impact_pct', sa.Float(), default=3.0),
        sa.Column('min_opportunity_score', sa.Float(), default=75.0),
        sa.Column('priority_fee_lamports', sa.Integer(), default=10000),
        sa.Column('compounding_mode', sa.String(), default='OFF'),
        sa.Column('kill_switch', sa.Boolean(), default=False),
        sa.Column('emergency_stop', sa.Boolean(), default=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'system_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('service', sa.String(), nullable=True),
        sa.Column('event', sa.String(), nullable=True),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('message', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'positions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('token_mint', sa.String(), nullable=True),
        sa.Column('symbol', sa.String(), nullable=True),
        sa.Column('entry_price', sa.Float(), nullable=True),
        sa.Column('current_price', sa.Float(), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=True),
        sa.Column('unrealized_pnl_usd', sa.Float(), default=0.0),
        sa.Column('unrealized_pnl_pct', sa.Float(), default=0.0),
        sa.Column('stop_loss_price', sa.Float(), nullable=True),
        sa.Column('take_profit_price', sa.Float(), nullable=True),
        sa.Column('trailing_stop_active', sa.Boolean(), default=False),
        sa.Column('status', sa.String(), default='OPEN'),
        sa.Column('opened_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'trades',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('execution_id', sa.String(), nullable=True),
        sa.Column('token_mint', sa.String(), nullable=True),
        sa.Column('symbol', sa.String(), nullable=True),
        sa.Column('side', sa.String(), nullable=True),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=True),
        sa.Column('fees_usd', sa.Float(), nullable=True),
        sa.Column('slippage_pct', sa.Float(), nullable=True),
        sa.Column('price_impact_pct', sa.Float(), nullable=True),
        sa.Column('gross_pnl_usd', sa.Float(), default=0.0),
        sa.Column('net_pnl_usd', sa.Float(), default=0.0),
        sa.Column('tx_signature', sa.String(), default=''),
        sa.Column('status', sa.String(), default='CONFIRMED'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('trades')
    op.drop_table('positions')
    op.drop_table('system_logs')
    op.drop_table('settings')
